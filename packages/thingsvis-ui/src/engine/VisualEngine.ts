import type { KernelStore, KernelState, NodeState, ConnectionState } from '@thingsvis/kernel';
import type { NodeSchemaType, PluginMainModule } from '@thingsvis/schema';
import { App, Rect, Group, Line } from 'leafer-ui';
import type { RendererFactory } from './renderers/types';
import { createPluginRenderer } from './renderers/pluginRenderer';
import { errorRenderer } from './renderers/errorRenderer';
import { PropertyResolver } from './PropertyResolver';

export class VisualEngine {
  private app?: App;
  private instanceMap = new Map<
    string,
    { instance: any; renderer: RendererFactory; overlayBox?: HTMLDivElement; overlayInst?: { destroy?: () => void } }
  >();
  private connectionMap = new Map<string, Line>();
  private root?: Group;
  private connRoot?: Group;
  private unsubscribe?: () => void;
  private overlayRoot?: HTMLDivElement;
  private containerEl?: HTMLElement;

  private rendererByType = new Map<string, RendererFactory>();
  private pendingRendererLoad = new Map<string, Promise<void>>();
  private failedRendererTypes = new Set<string>();
  private errorMessageByType = new Map<string, string>();
  private errorMessageByNode = new Map<string, string>();

  constructor(
    private store: KernelStore,
    private opts?: {
      resolvePlugin?: (type: string) => Promise<PluginMainModule>;
    }
  ) {}

  mount(container: HTMLElement) {
    this.containerEl = container;
    // DOM overlay 根节点（用于 ECharts/HTML 叠加）
    const overlayRoot = document.createElement('div');
    overlayRoot.style.position = 'absolute';
    overlayRoot.style.inset = '0';
    overlayRoot.style.pointerEvents = 'none';
    overlayRoot.style.zIndex = '5';
    container.appendChild(overlayRoot);
    this.overlayRoot = overlayRoot;

    this.app = new App({
      view: container,
      tree: {}
    });
    this.root = this.app.tree as unknown as Group;
    
    // Create a dedicated layer for connections (rendered below nodes)
    this.connRoot = new Group();
    this.root.addAt(this.connRoot, 0);

    // Subscribe to store updates
    this.unsubscribe = this.store.subscribe(() => {
      const state = this.store.getState() as KernelState;
      this.sync(state.nodesById, state.connections, state.layerOrder);
    });
    // Initial sync
    const state = this.store.getState() as KernelState;
    this.sync(state.nodesById, state.connections, state.layerOrder);
  }

  unmount() {
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = undefined;
    if (this.overlayRoot && this.overlayRoot.parentElement) {
      this.overlayRoot.parentElement.removeChild(this.overlayRoot);
    }
    this.overlayRoot = undefined;
    this.containerEl = undefined;
    this.app?.destroy?.();
    this.app = undefined;
    this.root = undefined;
    this.connRoot = undefined;
    this.instanceMap.clear();
    this.connectionMap.clear();
    this.errorMessageByNode.clear();
  }

  private isSyncing = false;

  sync(nodes: Record<string, NodeState>, connections: ConnectionState[] = [], layerOrder: string[] = []) {
    if (!this.app || !this.root || this.isSyncing) return;
    this.isSyncing = true;
    
    try {
      const root = this.root;

      // 1. Sync Nodes
      // Remove nodes that no longer exist or are hidden
      for (const [id, entry] of Array.from(this.instanceMap.entries())) {
        const nextNode = nodes[id];
        if (!nextNode || !nextNode.visible) {
          entry.renderer.destroy(entry.instance);
          if (entry.renderer.destroyOverlay && entry.overlayInst) {
            entry.renderer.destroyOverlay(entry.overlayInst as any);
          }
          if (entry.overlayBox?.parentElement) entry.overlayBox.parentElement.removeChild(entry.overlayBox);
          this.instanceMap.delete(id);
        }
      }

      // Add or update visible nodes
      Object.values(nodes).forEach(node => {
        // Wrap each node's sync in try-catch to isolate errors
        try {
          this.syncSingleNode(node, root);
        } catch (e) {
          // Log error but don't let it break other nodes
          console.error(`[VisualEngine] Error syncing node ${node.id}:`, e);
          this.errorMessageByNode.set(node.id, e instanceof Error ? e.message : String(e));
          
          // Try to create an error placeholder for this node
          try {
            if (!this.instanceMap.has(node.id)) {
              const instance = errorRenderer.create(node);
              root.add(instance as any);
              this.instanceMap.set(node.id, { instance, renderer: errorRenderer });
            }
          } catch (placeholderError) {
            console.error(`[VisualEngine] Failed to create error placeholder for node ${node.id}:`, placeholderError);
          }
        }
      });

      // 2. Apply Layer Order (bottom -> top)
      this.applyLayerOrder(nodes, layerOrder);

      // 3. Sync Connections
      this.syncConnections(nodes, connections);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Reorder rendered nodes (Leafer + DOM overlays) according to kernel layerOrder.
   * layerOrder is bottom -> top.
   */
  private applyLayerOrder(nodes: Record<string, NodeState>, layerOrder: string[]) {
    if (!this.root) return;

    const visibleIds = Object.values(nodes)
      .filter(n => n.visible)
      .map(n => n.id);

    const ordered: string[] = [];
    const seen = new Set<string>();

    for (const id of layerOrder ?? []) {
      if (!seen.has(id) && nodes[id]?.visible) {
        ordered.push(id);
        seen.add(id);
      }
    }

    for (const id of visibleIds) {
      if (!seen.has(id)) {
        ordered.push(id);
        seen.add(id);
      }
    }

    // connRoot is at index 0. Nodes should start at index 1.
    const baseIndex = 1;

    ordered.forEach((id, idx) => {
      const entry = this.instanceMap.get(id);
      if (!entry) return;

      try {
        // Reorder Leafer instance in the root group
        this.root!.addAt(entry.instance as any, baseIndex + idx);
        // Some Leafer objects respect zIndex; set it for safety.
        (entry.instance as any).zIndex = baseIndex + idx;
      } catch {
        // Best-effort: don't break sync on ordering issues
      }

      if (entry.overlayBox) {
        entry.overlayBox.style.zIndex = String(baseIndex + idx);
      }
    });
  }

  /**
   * Sync a single node - extracted to isolate error handling per node
   */
  private syncSingleNode(node: NodeState, root: Group) {
    if (!node.visible) return;
    
    const existing = this.instanceMap.get(node.id);
    const type = node.schemaRef.type;

    if (!existing) {
      const renderer = this.getRendererOrScheduleLoad(type);
      if (!renderer) {
        // not ready yet; will be created on next sync
        return;
      }

      let rendererToUse = renderer;
      let instance: any;
      try {
        instance = renderer.create(node);
      } catch (e) {
        rendererToUse = errorRenderer;
        this.errorMessageByNode.set(node.id, e instanceof Error ? e.message : String(e));
        instance = errorRenderer.create(node);
      }

      // If renderer is the errorRenderer, surface a non-fatal error into kernel state for visibility.
      const errMsg = this.errorMessageByNode.get(node.id) ?? this.errorMessageByType.get(type);
      if (errMsg && node.error !== errMsg) {
        const { setNodeError } = this.store.getState() as KernelState & { setNodeError?: (id: string, msg: string) => void };
        setNodeError?.(node.id, errMsg);
      }
      root.add(instance as any);

      // DOM overlay（仅当 renderer 支持且 overlayRoot 存在）
      let overlayBox: HTMLDivElement | undefined;
      let overlayInst: { destroy?: () => void } | undefined;
      const isResizable = rendererToUse.resizable !== false;
      
      if (rendererToUse.createOverlay && this.overlayRoot) {
        overlayBox = document.createElement('div');
        overlayBox.style.position = 'absolute';
        overlayBox.style.pointerEvents = 'auto';
        // Add data attribute for TransformControls to find and sync transforms during drag
        overlayBox.setAttribute('data-overlay-node-id', node.id);
        this.overlayRoot.appendChild(overlayBox);
        
        // 根据 resizable 属性决定定位方式
        this.positionOverlayBox(overlayBox, node, isResizable);
        
        try {
          const ov = rendererToUse.createOverlay(node);
          overlayInst = ov;
          overlayBox.appendChild(ov.element);
          
          // 对于自适应尺寸组件，在下一帧同步占位符尺寸
          if (!isResizable) {
            requestAnimationFrame(() => {
              // 使用 offsetWidth/offsetHeight 获取元素尺寸（不受 CSS transform 影响）
              const w = ov.element.offsetWidth;
              const h = ov.element.offsetHeight;
              if (w > 0 && h > 0) {
                // 1) sync Leafer placeholder (visual/interaction bounds)
                (instance as any).set?.({ width: w, height: h });
                // 2) sync schema.size so Studio proxy-layer / Moveable uses correct bounds
                const prev = (node.schemaRef as any)?.size;
                const prevW = typeof prev?.width === 'number' ? prev.width : undefined;
                const prevH = typeof prev?.height === 'number' ? prev.height : undefined;
                if (prevW !== w || prevH !== h) {
                  const { updateNode } = this.store.getState() as KernelState & {
                    updateNode?: (id: string, changes: { size?: { width: number; height: number } }) => void;
                  };
                  updateNode?.(node.id, { size: { width: w, height: h } });
                }
              }
            });
          }
        } catch (e) {
          // overlay 失败不影响主渲染
          console.error('[VisualEngine] overlay creation failed:', e);
          if (overlayBox.parentElement) overlayBox.parentElement.removeChild(overlayBox);
          overlayBox = undefined;
        }
      }

      this.instanceMap.set(node.id, { instance, renderer: rendererToUse, overlayBox, overlayInst });
      this.attachInteractionHandlers(instance as Rect, node);
      return;
    }

    try {
      existing.renderer.update(existing.instance, node);
      this.errorMessageByNode.delete(node.id);
    } catch (e) {
      // 单节点降级为 errorRenderer，不影响同类型其他节点
      this.errorMessageByNode.set(node.id, e instanceof Error ? e.message : String(e));
      existing.renderer.destroy(existing.instance);
      existing.renderer = errorRenderer;
      existing.instance = errorRenderer.create(node);
      root.add(existing.instance as any);
    }

    // 更新 overlay
    const isResizable = existing.renderer.resizable !== false;
    if (existing.overlayBox) {
      this.positionOverlayBox(existing.overlayBox, node, isResizable);
      
      // 对于自适应尺寸组件，同步占位符尺寸
      if (!isResizable && existing.overlayInst) {
        requestAnimationFrame(() => {
          // 使用 offsetWidth/offsetHeight 获取元素尺寸（不受 CSS transform 影响）
          const el = (existing.overlayInst as any)?.element;
          if (el) {
            const w = el.offsetWidth;
            const h = el.offsetHeight;
            if (w > 0 && h > 0) {
              (existing.instance as any).set?.({ width: w, height: h });
              const prev = (node.schemaRef as any)?.size;
              const prevW = typeof prev?.width === 'number' ? prev.width : undefined;
              const prevH = typeof prev?.height === 'number' ? prev.height : undefined;
              if (prevW !== w || prevH !== h) {
                const { updateNode } = this.store.getState() as KernelState & {
                  updateNode?: (id: string, changes: { size?: { width: number; height: number } }) => void;
                };
                updateNode?.(node.id, { size: { width: w, height: h } });
              }
            }
          }
        });
      }
    }
    if (existing.renderer.updateOverlay && existing.overlayInst) {
      existing.renderer.updateOverlay(existing.overlayInst as any, node);
    }
  }

  private syncConnections(nodes: Record<string, NodeState>, connections: ConnectionState[]) {
    if (!this.connRoot) return;

    const currentConnIds = new Set(connections.map(c => c.id));
    
    // Remove old connections
    for (const [id, line] of Array.from(this.connectionMap.entries())) {
      if (!currentConnIds.has(id)) {
        line.remove();
        this.connectionMap.delete(id);
      }
    }

    // Add or update connections
    connections.forEach(conn => {
      const source = nodes[conn.sourceNodeId];
      const target = nodes[conn.targetNodeId];
      if (!source || !target) return;

      const sp = source.schemaRef.position;
      const ss = (source.schemaRef as any).size ?? { width: 0, height: 0 };
      const tp = target.schemaRef.position;
      const ts = (target.schemaRef as any).size ?? { width: 0, height: 0 };

      // Simple center-to-center for MVP
      const x1 = sp.x + ss.width / 2;
      const y1 = sp.y + ss.height / 2;
      const x2 = tp.x + ts.width / 2;
      const y2 = tp.y + ts.height / 2;

      let line = this.connectionMap.get(conn.id);
      if (!line) {
        line = new Line({
          points: [x1, y1, x2, y2],
          stroke: conn.props?.stroke as string ?? '#6965db',
          strokeWidth: conn.props?.strokeWidth as number ?? 2,
          opacity: 0.6
        });
        this.connRoot!.add(line);
        this.connectionMap.set(conn.id, line);
      } else {
        line.set({ points: [x1, y1, x2, y2] });
      }
    });
  }


  private getRendererOrScheduleLoad(type: string): RendererFactory | undefined {
    const existing = this.rendererByType.get(type);
    if (existing) return existing;

    // Built-in fallback for legacy "rect" nodes
    if (type === 'rect') {
      const builtIn: RendererFactory = {
        create: node => new Rect(this.toRectProps(node)),
        update: (inst: any, node) => inst.set?.(this.toRectProps(node)),
        destroy: inst => inst.remove?.()
      };
      this.rendererByType.set(type, builtIn);
      return builtIn;
    }

    if (this.failedRendererTypes.has(type)) {
      return errorRenderer;
    }

    // Schedule async plugin resolve
    if (this.opts?.resolvePlugin && !this.pendingRendererLoad.get(type)) {
      const p = (async () => {
        try {
          const plugin = await this.opts!.resolvePlugin!(type);
          this.rendererByType.set(type, createPluginRenderer(plugin, this.store));
          this.errorMessageByType.delete(type);
          this.failedRendererTypes.delete(type);
        } catch (e) {
          // Fail closed: render error placeholder for this type
          this.rendererByType.set(type, errorRenderer);
          this.failedRendererTypes.add(type);
          this.errorMessageByType.set(type, e instanceof Error ? e.message : String(e));
          // eslint-disable-next-line no-console
          console.error('[VisualEngine] failed to resolve plugin renderer:', type, e);
        }
      })();
      this.pendingRendererLoad.set(type, p);
      p.finally(() => {
        this.pendingRendererLoad.delete(type);
        // 关键：插件 renderer 加载完成后立刻触发一次同步渲染（不依赖 store 状态变化）
        const state = this.store.getState() as KernelState;
        this.sync(state.nodesById, state.connections, state.layerOrder);
      }).catch(() => void 0);
    }

    return undefined;
  }

  private attachInteractionHandlers(rect: any, node: NodeState) {
    const nodeId = node.id;

    // Selection on click/tap
    rect.on('tap', () => {
      const { selectNode } = this.store.getState();
      if (selectNode) {
        selectNode(nodeId);
      }
    });

    // Persist final position on drag end to kernel store
    rect.on('drag.end', () => {
      const { updateNode } = this.store.getState() as KernelState & {
        updateNode?: (id: string, changes: { position?: { x: number; y: number } }) => void;
      };
      if (!updateNode) return;
      const { x, y } = rect;
      updateNode(nodeId, { position: { x, y } });
    });
  }

  private positionOverlayBox(box: HTMLDivElement, node: NodeState, isResizable: boolean = true) {
    const schema = node.schemaRef as any;
    const { x, y } = schema.position ?? { x: 0, y: 0 };
    // Read rotation from props._rotation (fallback to schema.rotation for compatibility)
    const rotation = schema.props?._rotation ?? schema.rotation ?? 0;
    
    box.style.left = `${x}px`;
    box.style.top = `${y}px`;
    
    if (isResizable) {
      // 固定尺寸组件：使用 schema 中定义的尺寸
      const width = schema.size?.width ?? 0;
      const height = schema.size?.height ?? 0;
      box.style.width = `${width}px`;
      box.style.height = `${height}px`;
      box.style.overflow = 'hidden';
      // 应用旋转，以中心为原点
      box.style.transform = rotation !== 0 ? `rotate(${rotation}deg)` : '';
      box.style.transformOrigin = 'center center';
    } else {
      // 自适应尺寸组件：让内容撑开
      box.style.width = 'auto';
      box.style.height = 'auto';
      box.style.overflow = 'visible';
      // 应用旋转
      box.style.transform = rotation !== 0 ? `rotate(${rotation}deg)` : '';
      box.style.transformOrigin = 'center center';
    }
  }

  private toRectProps(node: NodeState) {
    const schema = node.schemaRef;
    const width = schema.size?.width ?? 0;
    const height = schema.size?.height ?? 0;
    const { x, y } = schema.position;
    // Read rotation from props._rotation (fallback to schema.rotation for compatibility)
    const rotation = (schema as any).props?._rotation ?? (schema as any).rotation ?? 0;
    
    // Resolve expressions in props using PropertyResolver
    const dataSources = this.store.getState().dataSources;
    const resolvedProps = PropertyResolver.resolve(node, dataSources);

    const fill = resolvedProps.fill;

    return {
      x,
      y,
      width,
      height,
      rotation,
      fill,
      draggable: true,
      cursor: 'pointer'
    };
  }
}
