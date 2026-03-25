import type { KernelStore, KernelState, NodeState, ConnectionState } from '@thingsvis/kernel';
import type { WidgetMainModule } from '@thingsvis/schema';
import { DEFAULT_CANVAS_THEME } from '@thingsvis/schema';
import { App, Rect, Group } from 'leafer-ui';
import type { RendererFactory } from './renderers/types';
import { createWidgetRenderer } from './renderers/widgetRenderer';
import { errorRenderer } from './renderers/errorRenderer';
import { GridManager } from './managers/GridManager';
import { ConnectionManager } from './managers/ConnectionManager';
import { buildEmit, type EventHandlerConfig, type ActionRuntime } from './executeActions';
import { EventBus } from './EventBus';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { WidgetErrorBoundary } from '../components/WidgetErrorBoundary';
import { DomBridge } from '../components/DomBridge';

function isLineNodeType(type: string | undefined): boolean {
  return type === 'basic/line';
}

function isPipeNodeType(type: string | undefined): boolean {
  return type === 'industrial/pipe';
}

function isConnectorNodeType(type: string | undefined): boolean {
  return isLineNodeType(type) || isPipeNodeType(type);
}

function getConnectorPadding(strokeWidth?: unknown): number {
  const width = Number(strokeWidth ?? 2);
  return Math.max(28, Math.ceil(width * 2 + 16));
}

function buildElbowRoutePoints(
  a: { x: number; y: number },
  b: { x: number; y: number },
  sourceAnchor?: string,
  targetAnchor?: string,
) {
  const sourceHorizontal = sourceAnchor === 'left' || sourceAnchor === 'right';
  const sourceVertical = sourceAnchor === 'top' || sourceAnchor === 'bottom';
  const targetHorizontal = targetAnchor === 'left' || targetAnchor === 'right';
  const targetVertical = targetAnchor === 'top' || targetAnchor === 'bottom';

  if (sourceVertical && targetVertical) {
    const midY = (a.y + b.y) / 2;
    return [a, { x: a.x, y: midY }, { x: b.x, y: midY }, b];
  }
  if (sourceHorizontal && targetHorizontal) {
    const midX = (a.x + b.x) / 2;
    return [a, { x: midX, y: a.y }, { x: midX, y: b.y }, b];
  }
  if (sourceVertical && targetHorizontal) {
    return [a, { x: a.x, y: b.y }, b];
  }
  if (sourceHorizontal && targetVertical) {
    return [a, { x: b.x, y: a.y }, b];
  }
  const midX = (a.x + b.x) / 2;
  return [a, { x: midX, y: a.y }, { x: midX, y: b.y }, b];
}

function isHorizontalSegment(a: { x: number; y: number }, b: { x: number; y: number }, eps = 1) {
  return Math.abs(a.y - b.y) < eps;
}

function isVerticalSegment(a: { x: number; y: number }, b: { x: number; y: number }, eps = 1) {
  return Math.abs(a.x - b.x) < eps;
}

function orthogonalizePipePoints(
  points: Array<{ x: number; y: number }>,
  sourceAnchor?: string,
  targetAnchor?: string,
) {
  if (points.length < 2) return points;

  const result: Array<{ x: number; y: number }> = [points[0]!];

  const chooseElbow = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    prev?: { x: number; y: number },
    next?: { x: number; y: number },
    isFirst?: boolean,
    isLast?: boolean,
  ) => {
    let firstLeg: 'horizontal' | 'vertical' | null = null;

    if (isFirst) {
      if (sourceAnchor === 'left' || sourceAnchor === 'right') firstLeg = 'horizontal';
      if (sourceAnchor === 'top' || sourceAnchor === 'bottom') firstLeg = 'vertical';
    }

    if (!firstLeg && prev) {
      if (isHorizontalSegment(prev, a)) firstLeg = 'vertical';
      else if (isVerticalSegment(prev, a)) firstLeg = 'horizontal';
    }

    if (!firstLeg && next) {
      if (isHorizontalSegment(b, next)) firstLeg = 'horizontal';
      else if (isVerticalSegment(b, next)) firstLeg = 'vertical';
    }

    if (!firstLeg && isLast) {
      if (targetAnchor === 'left' || targetAnchor === 'right') firstLeg = 'vertical';
      if (targetAnchor === 'top' || targetAnchor === 'bottom') firstLeg = 'horizontal';
    }

    if (!firstLeg) {
      firstLeg = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y) ? 'horizontal' : 'vertical';
    }

    return firstLeg === 'horizontal' ? { x: b.x, y: a.y } : { x: a.x, y: b.y };
  };

  for (let i = 1; i < points.length; i++) {
    const a = result[result.length - 1]!;
    const b = points[i]!;

    if (isHorizontalSegment(a, b) || isVerticalSegment(a, b)) {
      result.push(b);
      continue;
    }

    const prev = result.length >= 2 ? result[result.length - 2] : undefined;
    const next = i < points.length - 1 ? points[i + 1] : undefined;
    const elbow = chooseElbow(a, b, prev, next, i === 1, i === points.length - 1);

    if (Math.abs(elbow.x - a.x) >= 1 || Math.abs(elbow.y - a.y) >= 1) {
      result.push(elbow);
    }
    result.push(b);
  }

  const compacted: Array<{ x: number; y: number }> = [result[0]!];
  for (let i = 1; i < result.length - 1; i++) {
    const prev = compacted[compacted.length - 1]!;
    const curr = result[i]!;
    const next = result[i + 1]!;
    const collinearX = isVerticalSegment(prev, curr) && isVerticalSegment(curr, next);
    const collinearY = isHorizontalSegment(prev, curr) && isHorizontalSegment(curr, next);
    if (collinearX || collinearY) continue;
    compacted.push(curr);
  }
  compacted.push(result[result.length - 1]!);

  if (compacted.length > 4) {
    return buildElbowRoutePoints(
      compacted[0]!,
      compacted[compacted.length - 1]!,
      sourceAnchor,
      targetAnchor,
    );
  }

  return compacted;
}

export class VisualEngine {
  private activeInlineTextEditor?:
    | {
        nodeId: string;
        overlayBox: HTMLDivElement;
        textarea: HTMLTextAreaElement;
        cleanup: () => void;
      }
    | undefined;
  private app?: App;
  private instanceMap = new Map<
    string,
    {
      instance: any;
      renderer: RendererFactory;
      overlayBox?: HTMLDivElement;
      overlayInst?: { destroy?: () => void };
      reactRoot?: Root;
      overlayClickCleanup?: () => void;
      overlayClickSignature?: string;
    }
  >();
  private root?: Group;
  private unsubscribe?: () => void;
  private overlayRoot?: HTMLDivElement;
  private containerEl?: HTMLElement;

  private gridManager?: GridManager;
  private connectionManager?: ConnectionManager;

  private rendererByType = new Map<string, RendererFactory>();
  private pendingRendererLoad = new Map<string, Promise<void>>();
  private failedRendererTypes = new Map<string, number>();
  private errorMessageByType = new Map<string, string>();
  private errorMessageByNode = new Map<string, string>();
  // Cache node props to detect changes and avoid unnecessary updates
  private lastNodePropsCache = new Map<string, string>();
  // Cache for auto-layout of connected line nodes (bbox/points)
  private lastLineAutoLayoutCache = new Map<string, string>();

  // Per-dashboard event bus for cross-widget communication
  private eventBus = new EventBus();

  // Track the last canvas theme written to overlayRoot to avoid redundant DOM writes
  private lastAppliedCanvasTheme = '';

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
    if (!isConnectorNodeType(node.schemaRef.type)) return;
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

    const padding = getConnectorPadding(props.strokeWidth);
    let worldPoints: Array<{ x: number; y: number }>;
    if (isPipeNodeType(node.schemaRef.type)) {
      if (pts && pts.length >= 3) {
        worldPoints = orthogonalizePipePoints(
          pts
            .filter((p) => typeof p?.x === 'number' && typeof p?.y === 'number')
            .map((p, index) => {
              if (index === 0) return startWorld;
              if (index === pts.length - 1) return endWorld;
              return localToWorld(p, startWorld);
            }),
          props.sourceAnchor,
          props.targetAnchor,
        );
      } else {
        worldPoints = buildElbowRoutePoints(startWorld, endWorld, props.sourceAnchor, props.targetAnchor);
      }
    } else {
      worldPoints = [startWorld, endWorld];
    }

    const minPointX = Math.min(...worldPoints.map((point) => point.x));
    const minPointY = Math.min(...worldPoints.map((point) => point.y));
    const maxPointX = Math.max(...worldPoints.map((point) => point.x));
    const maxPointY = Math.max(...worldPoints.map((point) => point.y));

    const nextPosition = { x: minPointX - padding, y: minPointY - padding };
    const nextSize = {
      width: Math.max(40, maxPointX - minPointX + padding * 2),
      height: Math.max(40, maxPointY - minPointY + padding * 2)
    };

    const nextPoints = worldPoints.map((point) => ({
      x: point.x - nextPosition.x,
      y: point.y - nextPosition.y,
    }));
    const key = JSON.stringify({ worldPoints, nextPosition, nextSize });
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
      actionRuntime?: ActionRuntime;
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

  private isInlineEditableTextNode(node: NodeState | undefined): boolean {
    if (this.opts?.editable === false || !node) return false;
    return String((node.schemaRef as any)?.type ?? '') === 'basic/text';
  }

  private getOverlayPointerEvents(nodeId: string): 'none' | 'auto' {
    return this.activeInlineTextEditor?.nodeId === nodeId
      ? 'auto'
      : this.opts?.editable !== false
        ? 'none'
        : 'auto';
  }

  private closeInlineTextEditor(options?: { commit?: boolean }) {
    const active = this.activeInlineTextEditor;
    if (!active) return;

    const { nodeId, overlayBox, textarea, cleanup } = active;
    const shouldCommit = options?.commit !== false;
    const node = (this.store.getState() as KernelState).nodesById[nodeId];

    if (shouldCommit && node) {
      const currentProps = (((node.schemaRef as any)?.props ?? {}) as Record<string, unknown>);
      const nextText = textarea.value;
      if ((currentProps.text ?? '') !== nextText) {
        (this.store.getState() as KernelState & {
          updateNode?: (id: string, changes: { props?: Record<string, unknown> }) => void;
        }).updateNode?.(nodeId, {
          props: {
            ...currentProps,
            text: nextText,
          },
        });
      }
    }

    cleanup();
    this.activeInlineTextEditor = undefined;
    overlayBox.style.pointerEvents = this.getOverlayPointerEvents(nodeId);
  }

  private openInlineTextEditor(nodeId: string, overlayBox: HTMLDivElement) {
    const node = (this.store.getState() as KernelState).nodesById[nodeId];
    if (!this.isInlineEditableTextNode(node)) return;
    if (this.activeInlineTextEditor?.nodeId === nodeId) return;

    this.closeInlineTextEditor({ commit: true });

    const props = (((node?.schemaRef as any)?.props ?? {}) as Record<string, unknown>);
    const textarea = document.createElement('textarea');
    textarea.value = typeof props.text === 'string' ? props.text : String(props.text ?? '');
    textarea.style.position = 'absolute';
    textarea.style.inset = '0';
    textarea.style.width = '100%';
    textarea.style.height = '100%';
    textarea.style.margin = '0';
    textarea.style.padding = '6px 8px';
    textarea.style.border = '1px solid #6965db';
    textarea.style.borderRadius = '6px';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.background = 'rgba(255,255,255,0.96)';
    textarea.style.color = String(props.fill ?? '#333333');
    textarea.style.fontSize = `${Number(props.fontSize ?? 16)}px`;
    textarea.style.fontFamily = String(
      props.fontFamily ?? 'Inter, Noto Sans SC, Noto Sans, sans-serif',
    );
    textarea.style.fontWeight = String(props.fontWeight ?? 'normal');
    textarea.style.fontStyle = String(props.fontStyle ?? 'normal');
    textarea.style.textAlign = String(props.textAlign ?? 'left') as any;
    textarea.style.lineHeight = String(props.lineHeight ?? 1.4);
    textarea.style.letterSpacing = `${Number(props.letterSpacing ?? 0)}px`;
    textarea.style.boxSizing = 'border-box';
    textarea.style.zIndex = '30';

    const handleBlur = () => this.closeInlineTextEditor({ commit: true });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closeInlineTextEditor({ commit: false });
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        this.closeInlineTextEditor({ commit: true });
      }
    };

    textarea.addEventListener('blur', handleBlur);
    textarea.addEventListener('keydown', handleKeyDown);
    overlayBox.style.pointerEvents = 'auto';
    overlayBox.appendChild(textarea);

    const cleanup = () => {
      textarea.removeEventListener('blur', handleBlur);
      textarea.removeEventListener('keydown', handleKeyDown);
      textarea.remove();
    };

    this.activeInlineTextEditor = { nodeId, overlayBox, textarea, cleanup };

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.select();
    });
  }

  private handleCanvasDoubleClick = (event: MouseEvent) => {
    if (this.opts?.editable === false) return;

    let matched: { nodeId: string; overlayBox: HTMLDivElement; zIndex: number } | null = null;

    this.instanceMap.forEach((entry, nodeId) => {
      const node = (this.store.getState() as KernelState).nodesById[nodeId];
      if (!this.isInlineEditableTextNode(node) || !entry.overlayBox) return;

      const rect = entry.overlayBox.getBoundingClientRect();
      const containsPoint =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!containsPoint) return;

      const zIndex = Number(entry.overlayBox.style.zIndex || '0');
      if (!matched || zIndex >= matched.zIndex) {
        matched = { nodeId, overlayBox: entry.overlayBox, zIndex };
      }
    });

    if (!matched) return;
    const target = matched as { nodeId: string; overlayBox: HTMLDivElement; zIndex: number };

    event.preventDefault();
    event.stopPropagation();
    (this.store.getState() as KernelState & { selectNode?: (id: string | null) => void }).selectNode?.(
      target.nodeId,
    );
    this.openInlineTextEditor(target.nodeId, target.overlayBox);
  };

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
    container.addEventListener('dblclick', this.handleCanvasDoubleClick);

    // Stamp the initial canvas theme so CSS selectors in canvas-themes.css take effect immediately.
    const initialTheme = (this.store.getState().page as any)?.config?.theme ?? DEFAULT_CANVAS_THEME;
    overlayRoot.dataset['canvasTheme'] = initialTheme;
    this.lastAppliedCanvasTheme = initialTheme;

    this.app = new App({
      view: container,
      tree: {}
    });
    this.root = this.app.tree as unknown as Group;

    // Initialize connection and grid managers
    this.connectionManager = new ConnectionManager(this.store, this.root);
    this.connectionManager.mount();
    this.gridManager = new GridManager(this.store, this.containerEl, this.root);
    this.gridManager.mount();

    // Subscribe to store updates
    this.unsubscribe = this.store.subscribe(() => {
      const state = this.store.getState() as KernelState;
      this.sync(state.nodesById, state.connections, state.layerOrder);
      this.gridManager?.sync(state);
    });

    // Initial sync
    const state = this.store.getState() as KernelState;
    this.sync(state.nodesById, state.connections, state.layerOrder);
    this.gridManager?.sync(state);
  }

  setEditable(editable: boolean) {
    if (!this.opts) this.opts = {};
    if (this.opts.editable === editable) return;
    this.opts.editable = editable;

    // Need to explicitly lock down all underlying Leafer objects
    // because proxy-layer pointerEvents="none" means events PASS THROUGH
    // to the VisualEngine layer below, triggering component dragging.
    const cursor = editable ? 'pointer' : 'default';
    const nodesById = (this.store.getState() as KernelState).nodesById;
    for (const [nodeId, entry] of this.instanceMap.entries()) {
      if (entry.instance && typeof entry.instance.set === 'function') {
        entry.instance.set({ draggable: editable, cursor });
      }
      if (entry.overlayBox) {
        entry.overlayBox.style.pointerEvents = this.getOverlayPointerEvents(nodeId);
      }
      const node = nodesById[nodeId];
      if (node) {
        this.syncOverlayClickFallback(node, entry);
      }
    }
  }

  unmount() {
    this.closeInlineTextEditor({ commit: true });
    this.containerEl?.removeEventListener('dblclick', this.handleCanvasDoubleClick);
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = undefined;
    if (this.overlayRoot && this.overlayRoot.parentElement) {
      this.overlayRoot.parentElement.removeChild(this.overlayRoot);
    }
    this.overlayRoot = undefined;
    this.containerEl = undefined;

    // Clean up managers
    this.gridManager?.unmount();
    this.gridManager = undefined;
    this.connectionManager?.unmount();
    this.connectionManager = undefined;

    this.app?.destroy?.();
    this.app = undefined;
    this.root = undefined;
    // Unmount all React roots before clearing instanceMap
    for (const entry of this.instanceMap.values()) {
      entry.overlayClickCleanup?.();
      if (entry.reactRoot) {
        try { entry.reactRoot.unmount(); } catch { /* already unmounted */ }
      }
    }
    this.instanceMap.clear();
    this.eventBus.dispose();
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



  private isSyncing = false;

  sync(nodes: Record<string, NodeState>, connections: ConnectionState[] = [], layerOrder: string[] = []) {
    if (!this.app || !this.root || this.isSyncing) return;
    this.isSyncing = true;

    try {
      const root = this.root;

      // Sync canvas theme attribute on overlayRoot so --w-* CSS tokens cascade to all widgets.
      // When the theme changes, invalidate all props caches to force a full widget update cycle.
      if (this.overlayRoot) {
        const currentTheme = (this.store.getState().page as any)?.config?.theme ?? DEFAULT_CANVAS_THEME;
        if (currentTheme !== this.lastAppliedCanvasTheme) {
          this.overlayRoot.dataset['canvasTheme'] = currentTheme;
          this.lastAppliedCanvasTheme = currentTheme;
          this.lastNodePropsCache.clear();
        }
      }

      // 1. Sync Nodes
      // Remove nodes that no longer exist or are hidden
      for (const [id, entry] of Array.from(this.instanceMap.entries())) {
        const nextNode = nodes[id];
        if (!nextNode || !nextNode.visible) {
          if (this.activeInlineTextEditor?.nodeId === id) {
            this.closeInlineTextEditor({ commit: false });
          }
          entry.overlayClickCleanup?.();
          entry.renderer.destroy(entry.instance);
          if (entry.renderer.destroyOverlay && entry.overlayInst) {
            // Pass the node state (may be undefined if node was removed from store — use cached id)
            const removingNode = nodes[id] ?? { id, schemaRef: {} } as unknown as NodeState;
            entry.renderer.destroyOverlay(entry.overlayInst as any, removingNode);
          }
          // Unmount React root before removing DOM
          if (entry.reactRoot) {
            try { entry.reactRoot.unmount(); } catch { /* already unmounted */ }
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
            console.error('[VisualEngine] errorRenderer itself failed for node', node.id, placeholderError);
          }
        }
      });

      // 2. Apply Layer Order (bottom -> top)
      this.applyLayerOrder(nodes, layerOrder);

      // 3. Sync Connections via manager
      this.connectionManager?.sync(nodes, connections);
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
        // Best-effort: don't break sync on Leafer reorder failures
        console.warn(`[VisualEngine] Failed to reorder node at index ${baseIndex + idx}`);
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
        overlayBox.style.pointerEvents = this.getOverlayPointerEvents(node.id);
        overlayBox.style.background = 'transparent';
        // Add data attribute for TransformControls to find and sync transforms during drag
        overlayBox.setAttribute('data-overlay-node-id', node.id);
        this.overlayRoot.appendChild(overlayBox);

        // 根据 resizable 属性决定定位方式
        this.positionOverlayBox(overlayBox, node, isResizable);

        try {
          // 构建 linkedNodes 用于节点连接功能
          const linkedNodes = this.buildLinkedNodes(node, allNodes);
          const contextWithLinks = {
            ...node,
            linkedNodes,
            theme: (this.store.getState().page as any)?.config?.theme || 'dawn',
            mode: (this.opts?.editable !== false ? 'edit' : 'view') as 'edit' | 'view',
            locale: (typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en'),
            visible: true,
            emit: buildEmit(
              () => (this.store.getState() as KernelState).nodesById[node.id]?.schemaRef,
              () => this.store.getState(),
              undefined,
              this.opts?.actionRuntime,
            ),
            on: (_event: string, _handler: (payload?: unknown) => void) => () => { },
          };

          const ov = rendererToUse.createOverlay(contextWithLinks);
          overlayInst = ov;

          // Mount overlay element through React WidgetErrorBoundary via DomBridge
          // This ensures runtime errors inside widgets are caught and isolated
          const widgetType = (node.schemaRef as any)?.type ?? 'unknown';
          const wrapperEl = document.createElement('div');
          wrapperEl.style.cssText = 'width:100%;height:100%';
          overlayBox.appendChild(wrapperEl);

          const reactRoot = createRoot(wrapperEl);
          reactRoot.render(
            React.createElement(WidgetErrorBoundary, {
              widgetType,
              onError: (error: Error) => {
                console.error(`[VisualEngine] Widget "${widgetType}" runtime error:`, error);
                const { setNodeError } = this.store.getState() as KernelState & {
                  setNodeError?: (id: string, msg: string) => void;
                };
                setNodeError?.(node.id, error.message);
              },
            },
              React.createElement(DomBridge, { element: ov.element })
            )
          );

          // Track reactRoot for cleanup
          (overlayInst as any).__reactRoot = reactRoot;

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
                  const state = this.store.getState() as KernelState & {
                    updateNode?: (id: string, changes: any) => void;
                  };
                  let changes: any = { size: { width: w, height: h } };

                  if (state.canvas?.mode === 'grid' && state.gridState?.settings) {
                    const settings = state.gridState.settings;
                    const cols = state.gridState.effectiveCols;
                    const containerWidth = state.gridState.containerWidth;
                    if (cols > 0 && containerWidth > 0) {
                      const colWidth = (containerWidth - (cols - 1) * settings.gap) / cols;
                      const cellWidth = colWidth + settings.gap;
                      const cellHeight = settings.rowHeight + settings.gap;

                      const gridW = Math.max(1, Math.round((w + settings.gap) / cellWidth));
                      const gridH = Math.max(1, Math.round((h + settings.gap) / cellHeight));

                      const prevGrid = (node.schemaRef as any)?.grid;
                      if (!prevGrid || prevGrid.w !== gridW || prevGrid.h !== gridH) {
                        changes.grid = { ...(prevGrid || {}), w: gridW, h: gridH };
                      }
                    }
                  }

                  state.updateNode?.(node.id, changes);
                }
              }
            });
          }
        } catch (e) {
          // overlay 创建失败 — 显示红色错误占位框，不传播到 App 级别（防白屏）
          // eslint-disable-next-line no-console
          console.error('[VisualEngine] Widget overlay failed to mount:', (node.schemaRef as any)?.type, e);
          if (overlayBox) {
            const widgetType = (node.schemaRef as any)?.type ?? 'unknown';
            const errMsg = e instanceof Error ? e.message : String(e);
            overlayBox.innerHTML = `
              <div style="
                width:100%;height:100%;
                display:flex;flex-direction:column;align-items:center;justify-content:center;
                background:rgba(239,68,68,0.08);
                border:1.5px dashed rgba(239,68,68,0.6);
                border-radius:6px;
                color:rgba(239,68,68,0.9);
                font-size:11px;
                font-family:monospace;
                padding:8px;
                gap:4px;
                box-sizing:border-box;
                overflow:hidden;
              ">
                <span style="font-weight:600;">⚠ ${widgetType}</span>
                <span style="opacity:0.7;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;">${errMsg}</span>
              </div>`;
          }
        }
      }

      this.instanceMap.set(node.id, {
        instance,
        renderer: rendererToUse,
        overlayBox,
        overlayInst,
        reactRoot: (overlayInst as any)?.__reactRoot,
      });
      const createdEntry = this.instanceMap.get(node.id);
      if (createdEntry) {
        this.syncOverlayClickFallback(node, createdEntry);
      }
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
      existing.overlayBox.style.pointerEvents = this.getOverlayPointerEvents(node.id);
      this.positionOverlayBox(existing.overlayBox, node, isResizable);
      this.syncOverlayClickFallback(node, existing);

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
                const state = this.store.getState() as KernelState & {
                  updateNode?: (id: string, changes: any) => void;
                };
                let changes: any = { size: { width: w, height: h } };

                // If in grid mode, ensure the auto-sized widget has enough grid blocks to prevent overlaps
                if (state.canvas?.mode === 'grid' && state.gridState?.settings) {
                  const settings = state.gridState.settings;
                  const cols = state.gridState.effectiveCols;
                  const containerWidth = state.gridState.containerWidth;
                  if (cols > 0 && containerWidth > 0) {
                    const colWidth = (containerWidth - (cols - 1) * settings.gap) / cols;
                    const cellWidth = colWidth + settings.gap;
                    const cellHeight = settings.rowHeight + settings.gap;

                    const gridW = Math.max(1, Math.round((w + settings.gap) / cellWidth));
                    const gridH = Math.max(1, Math.round((h + settings.gap) / cellHeight));

                    const prevGrid = (node.schemaRef as any)?.grid;
                    if (!prevGrid || prevGrid.w !== gridW || prevGrid.h !== gridH) {
                      changes.grid = { ...(prevGrid || {}), w: gridW, h: gridH };
                    }
                  }
                }

                state.updateNode?.(node.id, changes);
              }
            }
          }
        });
      }
    }
    if (existing.renderer.updateOverlay && existing.overlayInst) {
      try {
        // 构建 linkedNodes 用于节点连接功能
        const linkedNodes = this.buildLinkedNodes(node, allNodes);
        const linkedKey = JSON.stringify(linkedNodes);

        // 获取当前 state 用于解析数据绑定
        const state = this.store.getState() as KernelState;

        // 计算数据绑定相关的缓存 key
        // 需要包含：props + data bindings + 绑定相关的数据源数据
        const dataBindings = (node.schemaRef as any).data || [];

        // Stringify both props and data bindings once — used to scan for ds./var. references
        // so that expressions in either location trigger cache invalidation.
        const stringifiedContext = JSON.stringify((node.schemaRef as any).props || {}) + JSON.stringify(dataBindings);

        let dataSourceKey = '';
        if (stringifiedContext.includes('ds.')) {
          // 提取所有绑定表达式和 props 中引用的数据源 ID，计算相关数据源的值
          const referencedData: Record<string, any> = {};
          // 简单匹配 ds.<id> 模式（同时覆盖 props 和 dataBindings 中的引用）
          const matches = stringifiedContext.match(/ds\.([a-zA-Z0-9_-]+)/g);
          if (matches) {
            matches.forEach((match: string) => {
              const dsId = match.replace('ds.', '');
              if (state.dataSources && state.dataSources[dsId]) {
                referencedData[dsId] = state.dataSources[dsId].data;
              }
            });
          }
          dataSourceKey = JSON.stringify(referencedData);
        }

        // Extract referenced variables from props and bindings
        // We stringify both and search for `var.` references 
        // to ensure variable updates trigger a visual refresh.
        let variableKey = '';
        if (stringifiedContext.includes('var.')) {
          const referencedVars: Record<string, unknown> = {};
          // Match `var.varName` pattern
          const matches = stringifiedContext.match(/var\.([a-zA-Z0-9_-]+)/g);
          if (matches) {
            const varValues = (state as any).variableValues || {};
            matches.forEach((match: string) => {
              const varName = match.replace('var.', '');
              referencedVars[varName] = varValues[varName];
            });
            variableKey = JSON.stringify(referencedVars);
          }
        }

        // Include binding expressions AND transforms in the cache key so that any change
        // (expression switch, transform add/edit/clear) triggers an overlay update even when
        // the referenced datasource's raw data hasn't changed.
        const bindingExprsKey = dataBindings
          .map((b: any) => `${b.targetProp}:${b.expression ?? ''}:${b.transform ?? ''}`)
          .join('|');

        const canvasTheme = (this.store.getState().page as any)?.config?.theme || 'dawn';

        // Only call updateOverlay if props, linkedNodes, data source values, variable values,
        // binding expressions, or theme changed.
        // Platform field data (ds.__platform__) is already covered by dataSourceKey above.
        const propsKey = JSON.stringify((node.schemaRef as any).props || {}) + linkedKey + dataSourceKey + variableKey + '||' + bindingExprsKey + '||' + canvasTheme;
        const lastPropsKey = this.lastNodePropsCache.get(node.id);

        if (propsKey !== lastPropsKey) {
          this.lastNodePropsCache.set(node.id, propsKey);
          const contextWithLinks = { ...node, linkedNodes, theme: canvasTheme };
          existing.renderer.updateOverlay(existing.overlayInst as any, contextWithLinks);
        }

        // Keep connected line nodes' bbox/points in sync with linked nodes.
        // This ensures selection/handles match the visual connector even after moving other nodes.
        this.scheduleAutoLayoutConnectedLine(node, linkedNodes);
      } catch (e) {
        // Overlay 更新阶段发生错误（如外部组件 render 抛错/代码逻辑错误），隔离降级
        // 响应式更新抛错时保证其余组件不受影响，并转为错误块显示。
        console.error(`[VisualEngine] Widget overlay update failed for node ${node.id}:`, e);
        this.errorMessageByNode.set(node.id, e instanceof Error ? e.message : String(e));

        // 销毁旧的崩溃实例
        if (existing.reactRoot) {
          try { existing.reactRoot.unmount(); } catch { /* teardown — already unmounted */ }
        }
        if (existing.renderer.destroyOverlay) {
          try { existing.renderer.destroyOverlay(existing.overlayInst as any, node); } catch { /* teardown — overlay already destroyed */ }
        }
        if (existing.overlayBox) {
          existing.overlayBox.innerHTML = ''; // 清理 DOM 残留
        }
        try { existing.renderer.destroy(existing.instance); } catch { /* teardown — instance already destroyed */ }

        // 创建 errorRenderer 并替换当前渲染器
        existing.renderer = errorRenderer;
        existing.instance = errorRenderer.create(node);
        existing.reactRoot = undefined;
        existing.overlayInst = undefined;
        root.add(existing.instance as any);

        const { setNodeError } = this.store.getState() as KernelState & { setNodeError?: (id: string, msg: string) => void };
        setNodeError?.(node.id, e instanceof Error ? e.message : String(e));
      }
    }
  }


  private getNodeEventHandlers(node: NodeState, eventName: string): EventHandlerConfig[] {
    const handlers = (node.schemaRef as any)?.events;
    if (!Array.isArray(handlers)) return [];
    return handlers.filter((handler): handler is EventHandlerConfig => {
      return handler?.event === eventName && Array.isArray(handler.actions) && handler.actions.length > 0;
    });
  }

  private syncOverlayClickFallback(
    node: NodeState,
    entry: {
      overlayBox?: HTMLDivElement;
      overlayClickCleanup?: () => void;
      overlayClickSignature?: string;
    }
  ) {
    const box = entry.overlayBox;
    if (!box) return;

    const clickHandlers = this.getNodeEventHandlers(node, 'click');
    const type = String((node.schemaRef as any)?.type ?? '');
    const shouldBind = this.opts?.editable === false && type.startsWith('basic/') && clickHandlers.length > 0;
    const nextSignature = shouldBind ? JSON.stringify(clickHandlers) : '';

    if (entry.overlayClickSignature === nextSignature) {
      box.style.cursor = shouldBind ? 'pointer' : 'default';
      return;
    }

    entry.overlayClickCleanup?.();
    entry.overlayClickCleanup = undefined;
    entry.overlayClickSignature = nextSignature;
    box.style.cursor = shouldBind ? 'pointer' : 'default';

    if (!shouldBind) return;

    const emit = buildEmit(
      () => (this.store.getState() as KernelState).nodesById[node.id]?.schemaRef,
      () => this.store.getState(),
      undefined,
      this.opts?.actionRuntime,
    );

    const handleClick = (event: MouseEvent) => {
      if (this.opts?.editable !== false) return;
      emit('click', { nativeEvent: event });
    };

    box.addEventListener('click', handleClick);
    entry.overlayClickCleanup = () => {
      box.removeEventListener('click', handleClick);
    };
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

    const failedAt = this.failedRendererTypes.get(type);
    if (failedAt !== undefined && Date.now() - failedAt < 30_000) {
      return errorRenderer;
    }
    // If cooldown expired, allow retry
    if (failedAt !== undefined) {
      this.failedRendererTypes.delete(type);
    }

    // Schedule async widget resolve
    if (this.opts?.resolveWidget && !this.pendingRendererLoad.get(type)) {
      const p = (async () => {
        try {
          const widget = await this.opts!.resolveWidget!(type);
          this.rendererByType.set(
            type,
            createWidgetRenderer(
              widget,
              this.store,
              { editable: this.opts?.editable, actionRuntime: this.opts?.actionRuntime },
              this.eventBus,
            ),
          );
          this.errorMessageByType.delete(type);
          this.failedRendererTypes.delete(type);
        } catch (e) {
          // Fail closed: render error placeholder for this type
          this.rendererByType.set(type, errorRenderer);
          this.failedRendererTypes.set(type, Date.now());
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
      // 自适应尺寸组件：绝对定位时不能用 auto，
      // 否则在容器变窄时会触发 shrink-to-fit，把文本挤成竖排。
      box.style.width = 'max-content';
      box.style.height = 'max-content';
      box.style.maxWidth = 'none';
      box.style.maxHeight = 'none';
      box.style.overflow = 'visible';
      // 应用旋转
      box.style.transform = rotation !== 0 ? `rotate(${rotation}deg)` : '';
      box.style.transformOrigin = 'center center';
    }

    // Base Style Application
    const baseStyle = schema.baseStyle || {};

    // Background
    if (baseStyle.background) {
      box.style.backgroundColor = baseStyle.background.color || '';
      if (baseStyle.background.image) {
        box.style.backgroundImage = `url(${baseStyle.background.image})`;
        box.style.backgroundSize = '100% 100%';
      } else {
        box.style.backgroundImage = '';
      }
    } else {
      box.style.backgroundColor = '';
      box.style.backgroundImage = '';
    }

    // Border
    if (baseStyle.border) {
      box.style.borderWidth = baseStyle.border.width !== undefined ? `${baseStyle.border.width}px` : '';
      box.style.borderColor = baseStyle.border.color || '';
      box.style.borderStyle = baseStyle.border.style || 'solid';
      box.style.borderRadius = baseStyle.border.radius !== undefined ? `${baseStyle.border.radius}px` : '';
    } else {
      box.style.borderWidth = '';
      box.style.borderColor = '';
      box.style.borderStyle = '';
      box.style.borderRadius = '';
    }

    // Shadow
    if (baseStyle.shadow) {
      const offsetX = baseStyle.shadow.offsetX || 0;
      const offsetY = baseStyle.shadow.offsetY || 0;
      const blur = baseStyle.shadow.blur || 0;
      const color = baseStyle.shadow.color || 'rgba(0,0,0,0)';
      box.style.boxShadow = `${offsetX}px ${offsetY}px ${blur}px ${color}`;
    } else {
      box.style.boxShadow = '';
    }

    // Padding
    if (baseStyle.padding !== undefined) {
      box.style.padding = `${baseStyle.padding}px`;
      box.style.boxSizing = 'border-box';
    } else {
      box.style.padding = '';
      box.style.boxSizing = '';
    }

    // Opacity
    box.style.opacity = typeof baseStyle.opacity === 'number' ? String(baseStyle.opacity) : '1';
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
