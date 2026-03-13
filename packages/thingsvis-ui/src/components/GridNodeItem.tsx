import React, { useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import type { KernelStore, KernelState, NodeState } from '@thingsvis/kernel';
import type { WidgetMainModule, WidgetOverlayContext } from '@thingsvis/schema';
import type { PixelRect } from '../utils/grid-mapper';

/** Inline type — mirrors PluginOverlayInstance from @thingsvis/schema/widget-module */
interface PluginOverlayInstance {
    element: HTMLElement;
    update?: (ctx: WidgetOverlayContext) => void;
    destroy?: () => void;
}
import { PropertyResolver } from '../engine/PropertyResolver';
import { buildEmit } from '../engine/executeActions';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';

/** Known shape of node baseStyle coming from schema */
interface NodeBaseStyle {
    background?: { color?: string; image?: string };
    border?: { width?: number; color?: string; style?: string; radius?: number };
    shadow?: { blur?: number; offsetX?: number; offsetY?: number; color?: string };
    opacity?: number;
    padding?: number;
}

// ─── Resize handle direction type ───────────────────────────────────────────

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/** All 8 resize handle descriptors */
const RESIZE_HANDLES: Array<{
    dir: ResizeHandle;
    style: React.CSSProperties;
}> = [
        { dir: 'n', style: { top: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' } },
        { dir: 's', style: { bottom: -4, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' } },
        { dir: 'e', style: { right: -4, top: '50%', transform: 'translateY(-50%)', cursor: 'e-resize' } },
        { dir: 'w', style: { left: -4, top: '50%', transform: 'translateY(-50%)', cursor: 'w-resize' } },
        { dir: 'ne', style: { top: -4, right: -4, cursor: 'ne-resize' } },
        { dir: 'nw', style: { top: -4, left: -4, cursor: 'nw-resize' } },
        { dir: 'se', style: { bottom: -4, right: -4, cursor: 'se-resize' } },
        { dir: 'sw', style: { bottom: -4, left: -4, cursor: 'sw-resize' } },
    ];

const HANDLE_BASE_STYLE: React.CSSProperties = {
    position: 'absolute',
    width: 8,
    height: 8,
    background: '#0078d4',
    border: '1px solid #fff',
    borderRadius: 2,
    zIndex: 200,
};

// ─── Props ───────────────────────────────────────────────────────────────────

export interface GridNodeItemProps {
    nodeId: string;
    /** Pixel rect derived from gridToPixel() for this node */
    pixelRect: PixelRect;
    store: KernelStore;
    resolveWidget?: (type: string) => Promise<WidgetMainModule>;
    interactive: boolean;
    isSelected: boolean;
    theme?: string;
    /** Drag callbacks fed from useGridLayout */
    onDragStart: (nodeId: string, pixelPos: { x: number; y: number }) => void;
    onDragMove: (pixelPos: { x: number; y: number }) => void;
    onDragEnd: () => void;
    /** Resize callbacks fed from useGridLayout */
    onResizeStart: (nodeId: string, handle: ResizeHandle) => void;
    onResizeMove: (delta: { dx: number; dy: number }) => void;
    onResizeEnd: () => void;
    /** Select callback */
    onSelect: (nodeId: string) => void;
    /** Preview position override if pushed away by collision/compaction */
    previewPixelRect?: PixelRect | null;
    /** Current canvas zoom level to scale mouse deltas */
    zoom?: number;
}

// ─── Module cache (stable across re-renders) ─────────────────────────────────

const widgetModuleCache = new Map<string, WidgetMainModule>();

// ─── Context builder ─────────────────────────────────────────────────────────

function buildOverlayContext(
    node: NodeState,
    store: KernelStore,
    pixelRect: PixelRect,
    theme?: string
): WidgetOverlayContext {
    const state = store.getState() as KernelState & Record<string, unknown>;
    const resolvedProps = PropertyResolver.resolve(
        node,
        state.dataSources as Record<string, unknown>,
        (state as Record<string, unknown>).variableValues as Record<string, unknown> | undefined
    );

    return {
        position: { x: pixelRect.x, y: pixelRect.y },
        size: { width: pixelRect.width, height: pixelRect.height },
        props: resolvedProps,
        theme,
        mode: 'view',
        locale: typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en',
        visible: true,
        emit: buildEmit(
            () => (store.getState() as KernelState).nodesById[node.id]?.schemaRef,
            () => store.getState()
        ),
        on: (_event: string, _handler: (payload?: unknown) => void) => () => undefined,
    };
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * GridNodeItem
 *
 * Renders a single widget cell in grid mode.
 * Manages the createOverlay lifecycle and exposes drag/resize event handlers.
 * Positioned absolutely using pixelRect (computed from grid coordinates).
 */
export const GridNodeItem: React.FC<GridNodeItemProps> = ({
    nodeId,
    pixelRect,
    store,
    resolveWidget,
    interactive,
    isSelected,
    theme,
    onDragStart,
    onDragMove,
    onDragEnd,
    onResizeStart,
    onResizeMove,
    onResizeEnd,
    onSelect,
    previewPixelRect,
    zoom = 1,
}) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<Partial<PluginOverlayInstance>>({});

    // Reactive baseStyle — re-reads from store so background/border/etc. update without remount
    const [nodeBaseStyle, setNodeBaseStyle] = React.useState<NodeBaseStyle>(
        () => (store.getState() as KernelState).nodesById[nodeId]?.schemaRef?.baseStyle as NodeBaseStyle ?? {}
    );

    useEffect(() => {
        const unsub = store.subscribe((state: KernelState) => {
            const next = (state.nodesById[nodeId]?.schemaRef?.baseStyle) ?? {};
            setNodeBaseStyle((prev) =>
                JSON.stringify(prev) === JSON.stringify(next) ? prev : next
            );
        });
        return unsub;
    }, [store, nodeId]);

    // Local state for smooth ultra-fast visual dragging & resizing
    const [dragDelta, setDragDelta] = React.useState<{ dx: number; dy: number } | null>(null);
    const [resizeDelta, setResizeDelta] = React.useState<{ dx: number; dy: number; handle: ResizeHandle } | null>(null);

    // Keep a stable ref to the latest pixelRect to avoid stale closures in update effect
    const pixelRectRef = useRef(pixelRect);
    pixelRectRef.current = pixelRect;

    // ── Widget mount / unmount ────────────────────────────────────────────────

    useEffect(() => {
        if (!resolveWidget || !contentRef.current) return;

        const nodeState = (store.getState() as KernelState).nodesById[nodeId];
        if (!nodeState) return;
        const schema = nodeState.schemaRef as Record<string, unknown>;
        const widgetType = schema.type as string;

        let cancelled = false;

        const loadAndMount = async () => {
            let module = widgetModuleCache.get(widgetType);
            if (!module) {
                module = await resolveWidget(widgetType);
                widgetModuleCache.set(widgetType, module);
            }
            if (cancelled || !contentRef.current) return;

            contentRef.current.innerHTML = '';

            if (module.createOverlay) {
                const freshNode = (store.getState() as KernelState).nodesById[nodeId];
                if (!freshNode) return;
                const ctx = buildOverlayContext(freshNode, store, pixelRectRef.current, theme);
                const instance = module.createOverlay(ctx);
                if (cancelled || !contentRef.current) {
                    instance.destroy?.();
                    return;
                }
                instance.element.style.width = '100%';
                instance.element.style.height = '100%';
                contentRef.current.appendChild(instance.element);
                overlayRef.current = instance;
                // Element is now in the DOM — trigger a post-mount update so that
                // resolveWidgetColors() can walk up to the [data-canvas-theme] ancestor
                // and read the correct CSS custom properties. Without this, colors are
                // resolved before DOM insertion and fall back to the dawn defaults.
                if (instance.update) {
                    const postMountNode = (store.getState() as KernelState).nodesById[nodeId];
                    if (postMountNode) {
                        const postMountCtx = buildOverlayContext(postMountNode, store, pixelRectRef.current, theme);
                        instance.update(postMountCtx);
                    }
                }
            }
        };

        loadAndMount().catch((err) => {
            console.error(`[GridNodeItem] Failed to load widget (node=${nodeId}):`, err);
            if (!contentRef.current) return;
            const message = err instanceof Error ? err.message : String(err);
            contentRef.current.innerHTML = `
              <div style="padding:8px;color:#c53030;font-size:12px;background:#fff5f5;border:1px solid #feb2b2;border-radius:4px;height:100%;display:flex;align-items:center;justify-content:center;text-align:center">
                <span>Failed to load widget<br/><small>${message}</small></span>
              </div>`;
        });

        return () => {
            cancelled = true;
            overlayRef.current.destroy?.();
            overlayRef.current = {};
        };
        // Re-mount only when widget type or node changes identity; prop changes go through update effect
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodeId, resolveWidget, store]);

    // ── Widget update (props / data / pixelRect / dataSources change) ─────────

    // Subscribe to the store so React re-renders this component when data sources update.
    // Without this, incoming telemetry data (which only updates state.dataSources, not
    // state.nodesById) would never trigger useEffect to call overlay.update().
    const kernelState = useSyncExternalStore(
        useCallback((cb) => store.subscribe(cb), [store]),
        () => store.getState() as KernelState
    );
    const nodeState = kernelState.nodesById[nodeId];

    // Build a cache key fragment from the live values of referenced data sources.
    const dataSourceKey = React.useMemo(() => {
        if (!nodeState) return '';
        const schemaRef = nodeState.schemaRef as Record<string, unknown>;
        const haystack =
            JSON.stringify(schemaRef.props ?? {}) + JSON.stringify(schemaRef.data ?? []);
        if (!haystack.includes('ds.')) return '';
        const matches = haystack.match(/ds\.([a-zA-Z0-9_-]+)/g);
        if (!matches) return '';
        const snapshot: Record<string, unknown> = {};
        for (const m of matches) {
            const dsId = m.replace('ds.', '');
            if (kernelState.dataSources?.[dsId]) {
                snapshot[dsId] = kernelState.dataSources[dsId].data;
            }
        }
        return JSON.stringify(snapshot);
    }, [nodeState, kernelState.dataSources]);

    // Derive a stable cache key from node props + data bindings + pixelRect + live dataSources
    const updateKey = nodeState
        ? `${JSON.stringify((nodeState.schemaRef as Record<string, unknown>).props ?? {})}|${JSON.stringify((nodeState.schemaRef as Record<string, unknown>).data ?? [])}|${pixelRect.width}x${pixelRect.height}|${dataSourceKey}`
        : '';

    useEffect(() => {
        if (!overlayRef.current.update) return;
        const freshNode = (store.getState() as KernelState).nodesById[nodeId];
        if (!freshNode) return;
        const ctx = buildOverlayContext(freshNode, store, pixelRectRef.current, theme);
        overlayRef.current.update(ctx);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [updateKey, theme, store]);

    // ── Drag handling ─────────────────────────────────────────────────────────

    const dragStartPos = useRef<{ x: number; y: number } | null>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!interactive) return;
        // Left button only
        if (e.button !== 0) return;
        e.stopPropagation();

        onSelect(nodeId);

        const startX = e.clientX;
        const startY = e.clientY;
        dragStartPos.current = { x: startX, y: startY };
        onDragStart(nodeId, { x: startX, y: startY });

        setDragDelta({ dx: 0, dy: 0 });

        const handleMouseMove = (ev: MouseEvent) => {
            const z = zoom || 1;
            setDragDelta({ dx: (ev.clientX - startX) / z, dy: (ev.clientY - startY) / z });
            onDragMove({ x: ev.clientX, y: ev.clientY });
        };
        const handleMouseUp = () => {
            setDragDelta(null);
            onDragEnd();
            dragStartPos.current = null;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [interactive, nodeId, onDragStart, onDragMove, onDragEnd, onSelect]);

    // ── Resize handle handling ────────────────────────────────────────────────

    const buildResizeHandler = useCallback(
        (dir: ResizeHandle) => (e: React.MouseEvent<HTMLDivElement>) => {
            if (!interactive) return;
            e.stopPropagation();
            e.preventDefault();

            const startX = e.clientX;
            const startY = e.clientY;
            onResizeStart(nodeId, dir);
            setResizeDelta({ dx: 0, dy: 0, handle: dir });

            const handleMouseMove = (ev: MouseEvent) => {
                const z = zoom || 1;
                const dy = (ev.clientY - startY) / z;
                const dx = (ev.clientX - startX) / z;
                setResizeDelta({ dx, dy, handle: dir });
                onResizeMove({ dx, dy });
            };
            const handleMouseUp = () => {
                setResizeDelta(null);
                onResizeEnd();
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        },
        [interactive, nodeId, onResizeStart, onResizeMove, onResizeEnd]
    );

    // ── Render ────────────────────────────────────────────────────────────────

    const targetRect = previewPixelRect || pixelRect;

    let renderX = targetRect.x;
    let renderY = targetRect.y;
    let renderW = targetRect.width;
    let renderH = targetRect.height;
    let isInteracting = false;

    if (dragDelta) {
        isInteracting = true;
        renderX += dragDelta.dx;
        renderY += dragDelta.dy;
    } else if (resizeDelta) {
        isInteracting = true;
        const { dx, dy, handle } = resizeDelta;
        if (handle.includes('e')) renderW = Math.max(10, renderW + dx);
        if (handle.includes('s')) renderH = Math.max(10, renderH + dy);
        if (handle.includes('w')) {
            const clampDx = Math.min(dx, renderW - 10);
            renderX += clampDx;
            renderW -= clampDx;
        }
        if (handle.includes('n')) {
            const clampDy = Math.min(dy, renderH - 10);
            renderY += clampDy;
            renderH -= clampDy;
        }
    }

    return (
        <WidgetErrorBoundary widgetType={nodeId}>
            <div
                data-node-id={nodeId}
                onMouseDown={handleMouseDown}
                style={{
                    position: 'absolute',
                    left: renderX,
                    top: renderY,
                    width: renderW,
                    height: renderH,
                    boxSizing: 'border-box',
                    outline: isSelected && interactive ? '2px solid #0078d4' : undefined,
                    outlineOffset: -1,
                    cursor: interactive ? (dragDelta ? 'grabbing' : 'move') : 'default',
                    zIndex: isSelected ? 10 : 1,
                    // Remove transition during active dragging/resizing for immediate response
                    transition: isInteracting ? 'none' : 'left 0.2s ease, top 0.2s ease, width 0.2s ease, height 0.2s ease',
                    // baseStyle — applied from user settings in BaseStylePanel
                    backgroundColor: nodeBaseStyle.background?.color ?? undefined,
                    backgroundImage: nodeBaseStyle.background?.image
                        ? `url(${nodeBaseStyle.background.image})`
                        : undefined,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                    borderWidth: nodeBaseStyle.border?.width != null
                        ? `${nodeBaseStyle.border.width}px`
                        : undefined,
                    borderColor: nodeBaseStyle.border?.color ?? undefined,
                    borderStyle: nodeBaseStyle.border?.width != null
                        ? (nodeBaseStyle.border.style ?? 'solid')
                        : undefined,
                    borderRadius: nodeBaseStyle.border?.radius != null
                        ? `${nodeBaseStyle.border.radius}px`
                        : undefined,
                    boxShadow: nodeBaseStyle.shadow?.blur != null
                        ? `${nodeBaseStyle.shadow.offsetX ?? 0}px ${nodeBaseStyle.shadow.offsetY ?? 0}px ${nodeBaseStyle.shadow.blur}px ${nodeBaseStyle.shadow.color ?? 'rgba(0,0,0,0.2)'}`
                        : undefined,
                    opacity: nodeBaseStyle.opacity != null ? nodeBaseStyle.opacity : undefined,
                    padding: nodeBaseStyle.padding != null ? `${nodeBaseStyle.padding}px` : undefined,
                }}
            >
                {/* Widget content mount point */}
                <div
                    ref={contentRef}
                    style={{ width: '100%', height: '100%', overflow: 'hidden', pointerEvents: interactive ? 'none' : 'auto' }}
                />

                {/* Resize handles — only visible when selected in interactive mode */}
                {isSelected && interactive && RESIZE_HANDLES.map(({ dir, style }) => (
                    <div
                        key={dir}
                        onMouseDown={buildResizeHandler(dir)}
                        style={{ ...HANDLE_BASE_STYLE, ...style }}
                    />
                ))}
            </div>
        </WidgetErrorBoundary>
    );
};

export default React.memo(GridNodeItem, (prev, next) => {
    return (
        prev.nodeId === next.nodeId &&
        prev.interactive === next.interactive &&
        prev.isSelected === next.isSelected &&
        prev.theme === next.theme &&
        prev.pixelRect.x === next.pixelRect.x &&
        prev.pixelRect.y === next.pixelRect.y &&
        prev.pixelRect.width === next.pixelRect.width &&
        prev.pixelRect.height === next.pixelRect.height &&
        prev.previewPixelRect?.x === next.previewPixelRect?.x &&
        prev.previewPixelRect?.y === next.previewPixelRect?.y &&
        prev.previewPixelRect?.width === next.previewPixelRect?.width &&
        prev.previewPixelRect?.height === next.previewPixelRect?.height &&
        prev.zoom === next.zoom &&
        // We know callbacks from useGridLayout and store are stable by design
        prev.store === next.store
    );
});
