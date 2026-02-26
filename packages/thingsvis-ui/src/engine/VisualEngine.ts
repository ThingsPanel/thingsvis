import type { KernelStore, KernelState, NodeState, ConnectionState, GridState } from '@thingsvis/kernel';
import type { NodeSchemaType, WidgetMainModule, GridSettings } from '@thingsvis/schema';
import { App, Rect, Group, Line } from 'leafer-ui';
import { ExpressionEvaluator } from '@thingsvis/utils';
import type { RendererFactory } from './renderers/types';
import { createWidgetRenderer } from './renderers/widgetRenderer';
import { errorRenderer } from './renderers/errorRenderer';
import { GridOverlay } from './grid/GridOverlay';
import { GridPlaceholder } from './grid/GridPlaceholder';
import { gridToPixel } from '../utils/grid-mapper';

type Point = { x: number; y: number };
type ConnectionDirection = 'forward' | 'reverse' | 'bidirectional';

type ConnectionPathCache = {
  points: Point[];
  segLen: number[];
  cumLen: number[]; // cumLen[0]=0, cumLen[i] = length up to segment i-1
  total: number;
};

export class VisualEngine {
  private app?: App;
  private instanceMap = new Map<
    string,
    { instance: any; renderer: RendererFactory; overlayBox?: HTMLDivElement; overlayInst?: { destroy?: () => void } }
  >();
  private connectionMap = new Map<string, Line>();
  private connectionArrowMap = new Map<string, { a: Line; b: Line }>();
  private connectionFlowMap = new Map<string, Line[]>();
  private connectionPathCache = new Map<string, ConnectionPathCache>();
  private connectionFlowSpeedCache = new Map<string, number>();
  private flowRafId: number | null = null;
  private root?: Group;
  private connRoot?: Group;
  private unsubscribe?: () => void;
  private overlayRoot?: HTMLDivElement;
  private containerEl?: HTMLElement;

  // Grid layout overlay and placeholder
  private gridOverlay?: GridOverlay;
  private gridPlaceholder?: GridPlaceholder;
  private gridRoot?: Group;
  private lastGridSettings?: GridSettings;
  private lastGridPreview?: GridState['preview'];
  private resizeObserver?: ResizeObserver;
  private lastContainerWidth?: number;

  private rendererByType = new Map<string, RendererFactory>();
  private pendingRendererLoad = new Map<string, Promise<void>>();
  private failedRendererTypes = new Set<string>();
  private errorMessageByType = new Map<string, string>();
  private errorMessageByNode = new Map<string, string>();
  // Cache node props to detect changes and avoid unnecessary updates
  private lastNodePropsCache = new Map<string, string>();
  // Cache for auto-layout of connected line nodes (bbox/points)
  private lastLineAutoLayoutCache = new Map<string, string>();

  private getAnchorWorldPoint(
    position: { x: number; y: number },
    size: { width: number; height: number },
    anchor?: string
  ): { x: number; y: number } {
    const cx = position.x + size.width / 2;
    const cy = position.y + size.height / 2;
    switch (anchor) {
      case 'top':
        return { x: cx, y: position.y };
      case 'right':
        return { x: position.x + size.width, y: cy };
      case 'bottom':
        return { x: cx, y: position.y + size.height };
      case 'left':
        return { x: position.x, y: cy };
      case 'center':
      default:
        return { x: cx, y: cy };
    }
  }

  private scheduleAutoLayoutConnectedLine(node: NodeState, linkedNodes: Record<string, { id: string; position: { x: number; y: number }; size: { width: number; height: number } }>) {
    // Only for line nodes that have endpoint bindings
    if (node.schemaRef.type !== 'basic/line') return;
    const schema = node.schemaRef as any;
    const props = (schema.props || {}) as Record<string, any>;
    const hasBinding = !!(props.sourceNodeId || props.targetNodeId);
    if (!hasBinding) return;

    const lp = schema.position ?? { x: 0, y: 0 };
    const ls = schema.size ?? { width: 0, height: 0 };

    const source = props.sourceNodeId ? linkedNodes[props.sourceNodeId] : undefined;
    const target = props.targetNodeId ? linkedNodes[props.targetNodeId] : undefined;

    const pts = Array.isArray(props.points) ? (props.points as Array<any>) : null;
    const firstPt = pts && pts.length >= 2 ? pts[0] : null;
    const lastPt = pts && pts.length >= 2 ? pts[pts.length - 1] : null;
    const normalizedPts =
      firstPt && lastPt &&
      typeof firstPt?.x === 'number' && typeof firstPt?.y === 'number' &&
      typeof lastPt?.x === 'number' && typeof lastPt?.y === 'number' &&
      Math.max(firstPt.x, firstPt.y, lastPt.x, lastPt.y) <= 1;

    const localToWorld = (p: any, fallback: { x: number; y: number }) => {
      if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') return fallback;
      const dx = normalizedPts ? p.x * (ls.width ?? 0) : p.x;
      const dy = normalizedPts ? p.y * (ls.height ?? 0) : p.y;
      return { x: lp.x + dx, y: lp.y + dy };
    };

    const startWorld = source
      ? this.getAnchorWorldPoint(source.position, source.size, props.sourceAnchor)
      : localToWorld(firstPt, { x: lp.x, y: lp.y + (ls.height ?? 0) / 2 });

    const endWorld = target
      ? this.getAnchorWorldPoint(target.position, target.size, props.targetAnchor)
      : localToWorld(lastPt, { x: lp.x + (ls.width ?? 0), y: lp.y + (ls.height ?? 0) / 2 });

    const padding = 24;
    const minX = Math.min(startWorld.x, endWorld.x) - padding;
    const minY = Math.min(startWorld.y, endWorld.y) - padding;
    const maxX = Math.max(startWorld.x, endWorld.x) + padding;
    const maxY = Math.max(startWorld.y, endWorld.y) + padding;

    const nextPosition = { x: minX, y: minY };
    const nextSize = {
      width: Math.max(40, maxX - minX),
      height: Math.max(40, maxY - minY)
    };

    const nextPoints = [
      { x: startWorld.x - nextPosition.x, y: startWorld.y - nextPosition.y },
      { x: endWorld.x - nextPosition.x, y: endWorld.y - nextPosition.y }
    ];

    const key = JSON.stringify({ startWorld, endWorld, nextPosition, nextSize });
    const lastKey = this.lastLineAutoLayoutCache.get(node.id);
    if (key === lastKey) return;
    this.lastLineAutoLayoutCache.set(node.id, key);

    // Avoid re-entrancy: schedule into next frame.
    requestAnimationFrame(() => {
      const { updateNode } = this.store.getState() as KernelState & {
        updateNode?: (id: string, changes: { position?: { x: number; y: number }; size?: { width: number; height: number }; props?: Record<string, unknown> }) => void;
      };
      if (!updateNode) return;

      const fresh = (this.store.getState() as KernelState).nodesById[node.id];
      const freshSchema = (fresh?.schemaRef as any) || {};
      const curPos = freshSchema.position ?? { x: 0, y: 0 };
      const curSize = freshSchema.size ?? { width: 0, height: 0 };

      const posChanged = curPos.x !== nextPosition.x || curPos.y !== nextPosition.y;
      const sizeChanged = curSize.width !== nextSize.width || curSize.height !== nextSize.height;

      // Keep other props; just overwrite points.
      const curProps = (freshSchema.props || {}) as Record<string, unknown>;
      const curPts = (curProps as any).points;
      const ptsChanged = !Array.isArray(curPts) || curPts.length < 2 ||
        curPts[0]?.x !== nextPoints[0]!.x || curPts[0]?.y !== nextPoints[0]!.y ||
        curPts[curPts.length - 1]?.x !== nextPoints[1]!.x || curPts[curPts.length - 1]?.y !== nextPoints[1]!.y;

      if (!posChanged && !sizeChanged && !ptsChanged) return;

      updateNode(node.id, {
        position: nextPosition,
        size: nextSize,
        props: { ...curProps, points: nextPoints }
      });
    });
  }

  constructor(
    private store: KernelStore,
    private opts?: {
      resolveWidget?: (type: string) => Promise<WidgetMainModule>;
      editable?: boolean;
    }
  ) { }

  /**
   * 构建连接节点信息，用于 line 插件的节点连接功能
   * 从当前节点的 props 中提取 sourceNodeId/targetNodeId，
   * 返回对应节点的位置和尺寸信息
   */
  private buildLinkedNodes(
    node: NodeState,
    allNodes: Record<string, NodeState>
  ): Record<string, { id: string; position: { x: number; y: number }; size: { width: number; height: number } }> {
    const result: Record<string, { id: string; position: { x: number; y: number }; size: { width: number; height: number } }> = {};
    const props = (node.schemaRef as any).props || {};

    const nodeIds = [props.sourceNodeId, props.targetNodeId].filter(Boolean) as string[];

    for (const nodeId of nodeIds) {
      const linkedNode = allNodes[nodeId];
      if (linkedNode && linkedNode.schemaRef) {
        const schema = linkedNode.schemaRef as any;
        result[nodeId] = {
          id: nodeId,
          position: schema.position || { x: 0, y: 0 },
          size: schema.size || { width: 100, height: 100 },
        };
      }
    }

    return result;
  }

  mount(container: HTMLElement) {
    this.containerEl = container;
    // DOM overlay 根节点（用于 ECharts/HTML 叠加）
    const overlayRoot = document.createElement('div');
    overlayRoot.style.position = 'absolute';
    overlayRoot.style.inset = '0';
    overlayRoot.style.pointerEvents = 'none';
    overlayRoot.style.zIndex = '5';
    overlayRoot.style.background = 'transparent';
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

    // Initialize grid layout layers
    this.initGridLayers();

    // Set up container resize observer for responsive grid layout
    this.setupResizeObserver();

    // Subscribe to store updates
    this.unsubscribe = this.store.subscribe(() => {
      const state = this.store.getState() as KernelState;
      this.sync(state.nodesById, state.connections, state.layerOrder);
      this.syncGridState(state);
    });
    // Initial sync
    const state = this.store.getState() as KernelState;
    this.sync(state.nodesById, state.connections, state.layerOrder);
    this.syncGridState(state);
  }

  setEditable(editable: boolean) {
    if (!this.opts) this.opts = {};
    if (this.opts.editable === editable) return;
    this.opts.editable = editable;

    // Need to explicitly lock down all underlying Leafer objects
    // because proxy-layer pointerEvents="none" means events PASS THROUGH
    // to the VisualEngine layer below, triggering component dragging.
    const cursor = editable ? 'pointer' : 'default';
    for (const entry of this.instanceMap.values()) {
      if (entry.instance && typeof entry.instance.set === 'function') {
        entry.instance.set({ draggable: editable, cursor });
      }
    }
  }

  unmount() {
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = undefined;
    if (this.overlayRoot && this.overlayRoot.parentElement) {
      this.overlayRoot.parentElement.removeChild(this.overlayRoot);
    }
    this.overlayRoot = undefined;
    this.containerEl = undefined;

    // Clean up resize observer
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.lastContainerWidth = undefined;

    // Clean up grid layers
    this.gridOverlay?.dispose();
    this.gridOverlay = undefined;
    this.gridPlaceholder?.dispose();
    this.gridPlaceholder = undefined;
    this.gridRoot = undefined;
    this.lastGridSettings = undefined;
    this.lastGridPreview = undefined;

    this.app?.destroy?.();
    this.app = undefined;
    this.root = undefined;
    this.connRoot = undefined;
    this.instanceMap.clear();
    this.connectionMap.clear();
    for (const { a, b } of this.connectionArrowMap.values()) {
      a.remove();
      b.remove();
    }
    this.connectionArrowMap.clear();
    for (const markers of this.connectionFlowMap.values()) {
      markers.forEach(m => m.remove());
    }
    this.connectionFlowMap.clear();
    this.connectionPathCache.clear();
    this.connectionFlowSpeedCache.clear();
    if (this.flowRafId != null) cancelAnimationFrame(this.flowRafId);
    this.flowRafId = null;
    this.errorMessageByNode.clear();
  }

  /**
   * Set viewport transform (scale and offset) for the canvas
   * This applies the transform to the Leafer root group
   */
  setViewport(zoom: number, offsetX: number, offsetY: number) {
    if (!this.root) return;
    this.root.scaleX = zoom;
    this.root.scaleY = zoom;
    this.root.x = offsetX;
    this.root.y = offsetY;

    // Also update overlay root position
    if (this.overlayRoot) {
      this.overlayRoot.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`;
      this.overlayRoot.style.transformOrigin = '0 0';
    }
  }

  /**
   * Initialize grid layout layers (overlay at background, placeholder above nodes)
   */
  private initGridLayers() {
    if (!this.root) return;

    // Create grid root group to hold overlay and placeholder
    this.gridRoot = new Group();
    // Add grid root at index 0 (below connections and nodes)
    this.root.addAt(this.gridRoot, 0);

    // Grid overlay and placeholder will be lazily created when grid mode is active
  }

  /**
   * Set up container resize observer for responsive grid layout
   */
  private setupResizeObserver() {
    if (!this.containerEl) return;

    this.lastContainerWidth = this.containerEl.clientWidth;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;

        // Only update if width changed significantly (avoid subpixel jitter)
        if (this.lastContainerWidth !== undefined &&
          Math.abs(newWidth - this.lastContainerWidth) < 1) {
          continue;
        }

        this.lastContainerWidth = newWidth;

        // Update grid state with new container width
        const state = this.store.getState() as KernelState;
        if (state.canvas?.mode === 'grid' && state.updateGridContainerWidth) {
          state.updateGridContainerWidth(newWidth);
        }

        // Force re-sync of grid overlay with new dimensions
        this.lastGridSettings = undefined; // Force settings update
        this.syncGridState(state);
      }
    });

    this.resizeObserver.observe(this.containerEl);
  }

  /**
   * Sync grid state from store - update overlay and placeholder
   */
  private syncGridState(state: KernelState) {
    if (!this.root || !this.gridRoot || !this.containerEl) return;

    const gridState = state.gridState;
    const canvasMode = state.canvas?.mode;
    const isGridMode = canvasMode === 'grid';

    // If not in grid mode, hide/dispose grid elements
    if (!isGridMode) {
      this.gridOverlay?.setVisible(false);
      this.gridPlaceholder?.hide();
      return;
    }

    const settings = gridState?.settings;
    if (!settings) return;

    const containerWidth = this.containerEl.clientWidth;
    const containerHeight = this.containerEl.clientHeight;

    const cols = gridState?.effectiveCols ?? settings.cols ?? 24;
    const renderSettings: GridSettings = {
      ...settings,
      cols,
    };

    // Initialize or update grid overlay
    if (!this.gridOverlay) {
      this.gridOverlay = new GridOverlay();
      this.gridRoot.add(this.gridOverlay.getGroup());
    }

    // Check if settings changed
    const settingsChanged = JSON.stringify(renderSettings) !== JSON.stringify(this.lastGridSettings);
    if (settingsChanged) {
      this.lastGridSettings = renderSettings;
      this.gridOverlay.update({
        settings: renderSettings,
        containerWidth,
        containerHeight,
        visible: true
      });
    }

    this.gridOverlay.setVisible(true);

    // Initialize grid placeholder (rendered above nodes in overlay layer)
    if (!this.gridPlaceholder) {
      this.gridPlaceholder = new GridPlaceholder();
      // Add placeholder above grid overlay but still in grid root
      this.gridRoot.add(this.gridPlaceholder.getGroup());
    }

    // Update placeholder from preview state
    const preview = gridState?.preview;
    const previewChanged = JSON.stringify(preview) !== JSON.stringify(this.lastGridPreview);

    if (previewChanged) {
      this.lastGridPreview = preview;

      if (preview?.active && preview.targetPosition) {
        const previewRect = gridToPixel(preview.targetPosition, renderSettings, containerWidth);
        this.gridPlaceholder.updatePosition(previewRect, true);
        this.gridPlaceholder.show();

        // Update ghost overlays for affected items
        if (preview.affectedItems && preview.affectedItems.length > 0) {
          // Look up affected item positions from gridState
          const affectedNodes = preview.affectedItems
            .map(id => state.nodesById[id])
            .filter((node): node is NodeState => !!node && !!node.schemaRef);

          const ghostRects = affectedNodes.map(node => {
            const gridPos = (node.schemaRef as any).grid;
            if (!gridPos) return null;
            return {
              ...gridToPixel(gridPos, renderSettings, containerWidth)
            };
          }).filter((rect): rect is { x: number; y: number; width: number; height: number } => rect !== null);

          this.gridPlaceholder.updateGhosts(ghostRects);
        } else {
          this.gridPlaceholder.updateGhosts([]);
        }
      } else {
        this.gridPlaceholder.hide();
        this.gridPlaceholder.updateGhosts([]);
      }
    }
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
          // Clean up props cache
          this.lastNodePropsCache.delete(id);
        }
      }

      // Add or update visible nodes
      Object.values(nodes).forEach(node => {
        // Wrap each node's sync in try-catch to isolate errors
        try {
          this.syncSingleNode(node, root, nodes);
        } catch (e) {
          // Log error but don't let it break other nodes

          this.errorMessageByNode.set(node.id, e instanceof Error ? e.message : String(e));

          // Try to create an error placeholder for this node
          try {
            if (!this.instanceMap.has(node.id)) {
              const instance = errorRenderer.create(node);
              root.add(instance as any);
              this.instanceMap.set(node.id, { instance, renderer: errorRenderer });
            }
          } catch (placeholderError) {

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
  private syncSingleNode(node: NodeState, root: Group, allNodes: Record<string, NodeState>) {
    if (!node.visible) return;

    const existing = this.instanceMap.get(node.id);
    const type = node.schemaRef?.type;
    if (!type || typeof type !== 'string') {
      const msg = 'Invalid node type';
      this.errorMessageByNode.set(node.id, msg);
      const { setNodeError } = this.store.getState() as KernelState & { setNodeError?: (id: string, msg: string) => void };
      setNodeError?.(node.id, msg);
      return;
    }

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
        overlayBox.style.background = 'transparent';
        // Add data attribute for TransformControls to find and sync transforms during drag
        overlayBox.setAttribute('data-overlay-node-id', node.id);
        this.overlayRoot.appendChild(overlayBox);

        // 根据 resizable 属性决定定位方式
        this.positionOverlayBox(overlayBox, node, isResizable);

        try {
          // 构建 linkedNodes 用于节点连接功能
          const linkedNodes = this.buildLinkedNodes(node, allNodes);
          const contextWithLinks = { ...node, linkedNodes };

          const ov = rendererToUse.createOverlay(contextWithLinks);
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

          if (overlayBox.parentElement) overlayBox.parentElement.removeChild(overlayBox);
          overlayBox = undefined;
        }
      }

      this.instanceMap.set(node.id, { instance, renderer: rendererToUse, overlayBox, overlayInst });
      // Only attach interaction handlers when editable
      if (this.opts?.editable !== false) {
        this.attachInteractionHandlers(instance as Rect, node);
      }
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
      // 构建 linkedNodes 用于节点连接功能
      const linkedNodes = this.buildLinkedNodes(node, allNodes);
      const linkedKey = JSON.stringify(linkedNodes);

      // 获取当前 state 用于解析数据绑定
      const state = this.store.getState() as KernelState;

      // 计算数据绑定相关的缓存 key
      // 需要包含：props + data bindings + 绑定相关的数据源数据
      const dataBindings = (node.schemaRef as any).data || [];
      let dataSourceKey = '';
      if (Array.isArray(dataBindings) && dataBindings.length > 0) {
        // 提取所有绑定表达式中引用的数据源 ID，计算相关数据源的值
        const referencedData: Record<string, any> = {};
        dataBindings.forEach((binding: any) => {
          if (binding.expression && typeof binding.expression === 'string') {
            // 简单匹配 ds.<id> 模式
            const matches = binding.expression.match(/ds\.([a-zA-Z0-9_-]+)/g);
            if (matches) {
              matches.forEach((match: string) => {
                const dsId = match.replace('ds.', '');
                if (state.dataSources && state.dataSources[dsId]) {
                  referencedData[dsId] = state.dataSources[dsId].data;
                }
              });
            }
          }
        });
        dataSourceKey = JSON.stringify(referencedData);
      }

      // Only call updateOverlay if props, linkedNodes, or data source values actually changed
      const propsKey = JSON.stringify((node.schemaRef as any).props || {}) + linkedKey + dataSourceKey;
      const lastPropsKey = this.lastNodePropsCache.get(node.id);

      if (propsKey !== lastPropsKey) {
        this.lastNodePropsCache.set(node.id, propsKey);
        const contextWithLinks = { ...node, linkedNodes };
        existing.renderer.updateOverlay(existing.overlayInst as any, contextWithLinks);
      }

      // Keep connected line nodes' bbox/points in sync with linked nodes.
      // This ensures selection/handles match the visual connector even after moving other nodes.
      this.scheduleAutoLayoutConnectedLine(node, linkedNodes);
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

        const arrows = this.connectionArrowMap.get(id);
        if (arrows) {
          arrows.a.remove();
          arrows.b.remove();
          this.connectionArrowMap.delete(id);
        }

        const markers = this.connectionFlowMap.get(id);
        if (markers) {
          markers.forEach(m => m.remove());
          this.connectionFlowMap.delete(id);
        }
        this.connectionPathCache.delete(id);
        this.connectionFlowSpeedCache.delete(id);
      }
    }

    // Add or update connections
    let hasAnyFlow = false;
    connections.forEach(conn => {
      const source = nodes[conn.sourceNodeId];
      const target = nodes[conn.targetNodeId];
      if (!source || !target) return;

      const sp = source.schemaRef.position;
      const ss = (source.schemaRef as any).size ?? { width: 0, height: 0 };
      const tp = target.schemaRef.position;
      const ts = (target.schemaRef as any).size ?? { width: 0, height: 0 };

      // Endpoints (Phase 1 uses center-to-center; ports can be added in Phase 2)
      const p1: Point = { x: sp.x + ss.width / 2, y: sp.y + ss.height / 2 };
      const p2: Point = { x: tp.x + ts.width / 2, y: tp.y + ts.height / 2 };

      const style = (conn.props as any)?.style ?? {};
      const stroke = (style.stroke as string) ?? ((conn.props as any)?.stroke as string) ?? '#6965db';
      const strokeWidth = (style.strokeWidth as number) ?? ((conn.props as any)?.strokeWidth as number) ?? 2;
      const opacity = (style.opacity as number) ?? 0.6;
      const dashPattern = (style.dashPattern as number[] | undefined) ?? ((conn.props as any)?.dashPattern as number[] | undefined);

      // Path (polyline) — backward compatible with old connections
      const rawPath = (conn.props as any)?.path;
      let points: Point[] = [];
      if (rawPath && rawPath.kind === 'polyline' && Array.isArray(rawPath.points)) {
        points = rawPath.points
          .filter((pt: any) => pt && typeof pt.x === 'number' && typeof pt.y === 'number')
          .map((pt: any) => ({ x: pt.x, y: pt.y }));
      }
      if (points.length < 2) {
        points = [p1, p2];
      }
      // Keep endpoints attached while nodes move
      points[0] = p1;
      points[points.length - 1] = p2;

      const flatPoints: number[] = [];
      for (const pt of points) {
        flatPoints.push(pt.x, pt.y);
      }

      let line = this.connectionMap.get(conn.id);
      if (!line) {
        line = new Line({
          points: flatPoints,
          stroke,
          strokeWidth,
          opacity,
          ...(dashPattern ? { dashPattern } : {})
        });
        this.connRoot!.add(line);
        this.connectionMap.set(conn.id, line);
      } else {
        line.set({
          points: flatPoints,
          stroke,
          strokeWidth,
          opacity,
          ...(dashPattern ? { dashPattern } : { dashPattern: undefined as any })
        });
      }

      // Cache path for sampling/arrow tangent
      this.connectionPathCache.set(conn.id, this.buildPathCache(points));

      // Direction + arrows
      const direction = ((conn.props as any)?.direction as ConnectionDirection) ?? 'forward';
      this.syncConnectionArrows(conn.id, points, { stroke, strokeWidth, opacity }, direction);

      // Flow animation setup
      const flow = (conn.props as any)?.flow;
      const flowEnabled = !!flow?.enabled;
      if (flowEnabled) {
        hasAnyFlow = true;
        const speed = this.resolveFlowSpeed(flow?.speed);
        this.connectionFlowSpeedCache.set(conn.id, speed);
        this.syncConnectionFlowMarkers(conn.id, points, { stroke, strokeWidth, opacity }, flow);
      } else {
        // Remove markers if previously existed
        const existing = this.connectionFlowMap.get(conn.id);
        if (existing) {
          existing.forEach(m => m.remove());
          this.connectionFlowMap.delete(conn.id);
        }
        this.connectionFlowSpeedCache.delete(conn.id);
      }
    });

    if (hasAnyFlow) {
      this.startFlowLoop();
    } else {
      this.stopFlowLoop();
    }
  }


  private resolveFlowSpeed(input: unknown): number {
    if (typeof input === 'number' && Number.isFinite(input)) return input;
    if (typeof input === 'string') {
      // Support expression bindings using same context shape as PropertyResolver: { ds }
      if (input.includes('{{')) {
        try {
          const state = this.store.getState() as KernelState;
          const resolved = ExpressionEvaluator.evaluate(input, { ds: state.dataSources });
          const n = typeof resolved === 'number' ? resolved : Number(resolved);
          return Number.isFinite(n) ? n : 0;
        } catch {
          return 0;
        }
      }
      const n = Number(input);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  }

  private buildPathCache(points: Point[]): ConnectionPathCache {
    const segLen: number[] = [];
    const cumLen: number[] = [0];
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i]!;
      const b = points[i + 1]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      segLen.push(len);
      total += len;
      cumLen.push(total);
    }
    return { points, segLen, cumLen, total };
  }

  private samplePath(cache: ConnectionPathCache, s: number): { p: Point; dir: Point } {
    const { points, segLen, cumLen, total } = cache;
    if (points.length < 2 || total <= 0) {
      return { p: points[0] ?? { x: 0, y: 0 }, dir: { x: 1, y: 0 } };
    }
    let dist = s;
    if (dist < 0) dist = 0;
    if (dist > total) dist = total;
    // Find segment index i such that cumLen[i] <= dist < cumLen[i+1]
    let i = 0;
    while (i < segLen.length - 1 && (cumLen[i + 1] ?? total) < dist) i++;
    const a = points[i]!;
    const b = points[i + 1]!;
    const len = segLen[i] ?? 0;
    const base = cumLen[i] ?? 0;
    const t = len <= 0 ? 0 : (dist - base) / len;
    const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const dir = { x: dx / d, y: dy / d };
    return { p, dir };
  }

  private rotate(v: Point, rad: number): Point {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
  }

  private syncConnectionArrows(
    id: string,
    points: Point[],
    style: { stroke: string; strokeWidth: number; opacity: number },
    direction: ConnectionDirection
  ) {
    if (!this.connRoot) return;

    const wantStart = direction === 'reverse' || direction === 'bidirectional';
    const wantEnd = direction === 'forward' || direction === 'bidirectional';

    // We model arrows as a pair of small lines. For simplicity, we always keep a pair
    // and hide them by setting opacity=0 when not needed.
    let arrows = this.connectionArrowMap.get(id);
    if (!arrows) {
      arrows = {
        a: new Line({ points: [0, 0, 0, 0], stroke: style.stroke, strokeWidth: Math.max(1, style.strokeWidth), opacity: 0 }),
        b: new Line({ points: [0, 0, 0, 0], stroke: style.stroke, strokeWidth: Math.max(1, style.strokeWidth), opacity: 0 })
      };
      this.connRoot.add(arrows.a);
      this.connRoot.add(arrows.b);
      this.connectionArrowMap.set(id, arrows);
    }

    const updateArrowAt = (tip: Point, dir: Point, visible: boolean) => {
      const len = Math.max(8, style.strokeWidth * 4);
      const phi = Math.PI / 6; // 30deg
      const back = { x: -dir.x, y: -dir.y };
      const v1 = this.rotate(back, phi);
      const v2 = this.rotate(back, -phi);
      const p1 = { x: tip.x + v1.x * len, y: tip.y + v1.y * len };
      const p2 = { x: tip.x + v2.x * len, y: tip.y + v2.y * len };
      arrows!.a.set({ points: [tip.x, tip.y, p1.x, p1.y], stroke: style.stroke, strokeWidth: Math.max(1, style.strokeWidth), opacity: visible ? style.opacity : 0 });
      arrows!.b.set({ points: [tip.x, tip.y, p2.x, p2.y], stroke: style.stroke, strokeWidth: Math.max(1, style.strokeWidth), opacity: visible ? style.opacity : 0 });
    };

    // Prefer end arrow if both requested; start arrow uses same two lines but would conflict.
    // Phase 1: show a single arrow (end for forward, start for reverse, end for bidirectional).
    if (wantEnd && points.length >= 2) {
      const tip = points[points.length - 1]!;
      const prev = points[points.length - 2]!;
      const d = Math.hypot(tip.x - prev.x, tip.y - prev.y) || 1;
      const dir = { x: (tip.x - prev.x) / d, y: (tip.y - prev.y) / d };
      updateArrowAt(tip, dir, true);
    } else if (wantStart && points.length >= 2) {
      const tip = points[0]!;
      const next = points[1]!;
      const d = Math.hypot(tip.x - next.x, tip.y - next.y) || 1;
      const dir = { x: (tip.x - next.x) / d, y: (tip.y - next.y) / d };
      updateArrowAt(tip, dir, true);
    } else {
      arrows.a.set({ opacity: 0 });
      arrows.b.set({ opacity: 0 });
    }
  }

  private syncConnectionFlowMarkers(
    id: string,
    points: Point[],
    style: { stroke: string; strokeWidth: number; opacity: number },
    flow: any
  ) {
    if (!this.connRoot) return;
    const cache = this.connectionPathCache.get(id) ?? this.buildPathCache(points);
    this.connectionPathCache.set(id, cache);
    const total = cache.total;
    if (total <= 0) return;

    const spacing = typeof flow?.spacing === 'number' && flow.spacing > 0 ? flow.spacing : 24;
    const markerSize = typeof flow?.markerSize === 'number' && flow.markerSize > 0 ? flow.markerSize : 10;

    const count = Math.min(40, Math.max(1, Math.floor(total / spacing)));
    let markers = this.connectionFlowMap.get(id);
    if (!markers) {
      markers = [];
      this.connectionFlowMap.set(id, markers);
    }
    while (markers.length < count) {
      const m = new Line({
        points: [0, 0, 0, 0],
        stroke: style.stroke,
        strokeWidth: Math.max(1, style.strokeWidth),
        opacity: style.opacity
      });
      this.connRoot.add(m);
      markers.push(m);
    }
    while (markers.length > count) {
      const m = markers.pop();
      m?.remove();
    }

    // Store per-marker config on the array object (kept local)
    (markers as any).__thingsvis_flow_spacing__ = spacing;
    (markers as any).__thingsvis_flow_markerSize__ = markerSize;
  }

  private startFlowLoop() {
    if (this.flowRafId != null) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      this.updateFlowFrame(t);
      this.flowRafId = requestAnimationFrame(tick);
    };
    this.flowRafId = requestAnimationFrame(tick);
  }

  private stopFlowLoop() {
    if (this.flowRafId == null) return;
    cancelAnimationFrame(this.flowRafId);
    this.flowRafId = null;
  }

  private updateFlowFrame(tSec: number) {
    for (const [id, markers] of this.connectionFlowMap.entries()) {
      const cache = this.connectionPathCache.get(id);
      if (!cache || cache.total <= 0) continue;
      const speed = this.connectionFlowSpeedCache.get(id) ?? 0;
      if (!Number.isFinite(speed) || speed === 0) continue;

      const spacing = (markers as any).__thingsvis_flow_spacing__ ?? 24;
      const markerSize = (markers as any).__thingsvis_flow_markerSize__ ?? 10;
      const total = cache.total;
      const base = ((tSec * speed) % total + total) % total;

      for (let i = 0; i < markers.length; i++) {
        const s = (base + i * spacing) % total;
        const { p, dir } = this.samplePath(cache, s);
        const dx = dir.x;
        const dy = dir.y;
        const x1 = p.x - dx * (markerSize / 2);
        const y1 = p.y - dy * (markerSize / 2);
        const x2 = p.x + dx * (markerSize / 2);
        const y2 = p.y + dy * (markerSize / 2);
        markers[i]!.set({ points: [x1, y1, x2, y2] });
      }
    }
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

    // Schedule async widget resolve
    if (this.opts?.resolveWidget && !this.pendingRendererLoad.get(type)) {
      const p = (async () => {
        try {
          const widget = await this.opts!.resolveWidget!(type);
          this.rendererByType.set(type, createWidgetRenderer(widget, this.store, { editable: this.opts?.editable }));
          this.errorMessageByType.delete(type);
          this.failedRendererTypes.delete(type);
        } catch (e) {
          // Fail closed: render error placeholder for this type
          this.rendererByType.set(type, errorRenderer);
          this.failedRendererTypes.add(type);
          this.errorMessageByType.set(type, e instanceof Error ? e.message : String(e));
          // eslint-disable-next-line no-console

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

    const isEditable = this.opts?.editable ?? true;
    return {
      x,
      y,
      width,
      height,
      rotation,
      fill: 'transparent', // Always transparent - visual rendering is done via DOM overlay
      draggable: isEditable,
      cursor: isEditable ? 'pointer' : 'default'
    };
  }
}
