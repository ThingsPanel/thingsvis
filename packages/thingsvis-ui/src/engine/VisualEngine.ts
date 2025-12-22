import type { KernelStore, KernelState, NodeState, ConnectionState } from '@thingsvis/kernel';
import type { NodeSchemaType, PluginMainModule } from '@thingsvis/schema';
import { App, Rect, Group, Line } from 'leafer-ui';
import type { RendererFactory } from './renderers/types';
import { createPluginRenderer } from './renderers/pluginRenderer';
import { errorRenderer } from './renderers/errorRenderer';

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
      this.sync(state.nodesById, state.connections);
    });
    // Initial sync
    const state = this.store.getState() as KernelState;
    this.sync(state.nodesById, state.connections);
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

  sync(nodes: Record<string, NodeState>, connections: ConnectionState[] = []) {
    if (!this.app || !this.root) return;
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
      if (!node.visible) return;
      const existing = this.instanceMap.get(node.schemaRef.id);
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
        if (errMsg) {
          const { setNodeError } = this.store.getState() as KernelState & { setNodeError?: (id: string, msg: string) => void };
          setNodeError?.(node.id, errMsg);
        }
        root.add(instance as any);

        // DOM overlay（仅当 renderer 支持且 overlayRoot 存在）
        let overlayBox: HTMLDivElement | undefined;
        let overlayInst: { destroy?: () => void } | undefined;
        if (rendererToUse.createOverlay && this.overlayRoot) {
          overlayBox = document.createElement('div');
          overlayBox.style.position = 'absolute';
          overlayBox.style.pointerEvents = 'auto';
          overlayBox.style.overflow = 'hidden';
          this.overlayRoot.appendChild(overlayBox);
          this.positionOverlayBox(overlayBox, node);
          try {
            const ov = rendererToUse.createOverlay(node);
            overlayInst = ov;
            overlayBox.appendChild(ov.element);
          } catch (e) {
            // overlay 失败不影响主渲染
            // eslint-disable-next-line no-console
            console.error('[VisualEngine] overlay creation failed:', e);
            if (overlayBox.parentElement) overlayBox.parentElement.removeChild(overlayBox);
            overlayBox = undefined;
          }
        }

        this.instanceMap.set(node.schemaRef.id, { instance, renderer: rendererToUse, overlayBox, overlayInst });
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
      if (existing.overlayBox) {
        this.positionOverlayBox(existing.overlayBox, node);
      }
      if (existing.renderer.updateOverlay && existing.overlayInst) {
        existing.renderer.updateOverlay(existing.overlayInst as any, node);
      }
    });

    // 2. Sync Connections
    this.syncConnections(nodes, connections);
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
        create: node => new Rect(this.toRectProps(node.schemaRef)),
        update: (inst: any, node) => inst.set?.(this.toRectProps(node.schemaRef)),
        destroy: inst => inst.remove?.()
      };
      this.rendererByType.set(type, builtIn);
      return builtIn;
    }

    // Schedule async plugin resolve
    if (this.opts?.resolvePlugin && !this.pendingRendererLoad.get(type)) {
      const p = (async () => {
        try {
          const plugin = await this.opts!.resolvePlugin!(type);
          this.rendererByType.set(type, createPluginRenderer(plugin));
          this.errorMessageByType.delete(type);
        } catch (e) {
          // Fail closed: render error placeholder for this type
          this.rendererByType.set(type, errorRenderer);
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
        this.sync(state.nodesById);
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

  private positionOverlayBox(box: HTMLDivElement, node: NodeState) {
    const schema = node.schemaRef as any;
    const { x, y } = schema.position ?? { x: 0, y: 0 };
    const width = schema.size?.width ?? 0;
    const height = schema.size?.height ?? 0;
    box.style.left = `${x}px`;
    box.style.top = `${y}px`;
    box.style.width = `${width}px`;
    box.style.height = `${height}px`;
  }

  private toRectProps(schema: NodeSchemaType) {
    const width = schema.size?.width ?? 0;
    const height = schema.size?.height ?? 0;
    const { x, y } = schema.position;
    const fill = (schema.props as { fill?: string } | undefined)?.fill;

    return {
      x,
      y,
      width,
      height,
      fill,
      draggable: true,
      cursor: 'pointer'
    };
  }
}


