import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
    useMemo,
} from 'react';
import { useSyncExternalStore } from 'react';
import type { KernelStore, KernelState, NodeState } from '@thingsvis/kernel';
import { GridSystem } from '@thingsvis/kernel';
import type { GridSettings, WidgetMainModule, WidgetOverlayContext } from '@thingsvis/schema';
import { validateCanvasTheme } from '@thingsvis/schema';
import { useGridLayout } from '../hooks/useGridLayout';
import { clientPointToGrid, gridToPixel } from '../utils/grid-mapper';
import { GridCanvasBackground } from './GridCanvasBackground';
import { GridDropTarget } from './GridDropTarget';
import { GridNodeItem, type ResizeHandle } from './GridNodeItem';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface GridCanvasProps {
    /** Kernel store instance */
    store: KernelStore;
    /** Grid settings override (falls back to store.gridState.settings) */
    settings?: GridSettings;
    /** Widget module resolver: type string → WidgetMainModule */
    resolveWidget?: (type: string) => Promise<WidgetMainModule>;
    /** Called when user drops a widget from the ComponentsList */
    onDropComponent?: (
        componentType: string,
        gridPos: { x: number; y: number; w: number; h: number }
    ) => void;
    /** Fixed pixel width (undefined = 100%) */
    width?: number;
    /** Fixed pixel height (undefined = auto; grows with grid content) */
    height?: number;
    /** Enable drag/resize interactions */
    interactive?: boolean;
    /**
     * Full-width mode for embed contexts.
     * When true: fills container width, no horizontal centering, no box-shadow.
     */
    fullWidth?: boolean;
    /**
     * Override whether grid lines are shown.
     * Defaults to effectiveSettings.showGridLines when undefined.
     * Pass false in preview/embed contexts to suppress the editor grid overlay.
     */
    showGridLines?: boolean;
    /** Zoom level [0.1..2.0] used by the editor viewport */
    zoom?: number;
    /** Called when the user changes zoom via Ctrl+scroll */
    onZoomChange?: (zoomPercent: number) => void;
    /** Canvas theme identifier (matched against theme registry) */
    theme?: string;
    /** Panel-aware centering offsets */
    centerPadding?: { left?: number; right?: number };
    /** Widget runtime mode forwarded to DOM overlays */
    widgetMode?: WidgetOverlayContext['mode'];
}

/** Inset applied to the editor scroll-container so element borders/shadows are never clipped by overflow:hidden. */
const CANVAS_EDITOR_PADDING = 16;

// ─── Default grid settings (mirrors GridSettingsSchema defaults) ──────────────

const DEFAULT_SETTINGS: GridSettings = {
    cols: 24,
    rowHeight: 50,
    gap: 10,
    compactVertical: true,
    minW: 1,
    minH: 1,
    showGridLines: true,
    breakpoints: [],
    responsive: true,
};

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * GridCanvas
 *
 * Pure-React grid mode canvas that replaces GridStackCanvas.
 * Reads all layout state from KernelStore (self-built GridSystem).
 * Widget instances are managed via the createOverlay() protocol — identical
 * to the fixed/infinite CanvasView.
 */
export const GridCanvas: React.FC<GridCanvasProps> = ({
    store,
    settings: settingsProp,
    resolveWidget,
    onDropComponent,
    width,
    height,
    interactive = true,
    fullWidth = false,
    showGridLines: showGridLinesProp,
    zoom = 1,
    onZoomChange,
    theme,
    centerPadding,
    widgetMode = 'view',
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    // ── Store subscription ────────────────────────────────────────────────────

    const kernelState = useSyncExternalStore(
        useCallback((cb) => store.subscribe(cb), [store]),
        () => store.getState() as KernelState
    );

    // ── Effective settings (prop override > store > defaults) ─────────────────

    const effectiveSettings = useMemo(
        () => settingsProp ?? kernelState.gridState?.settings ?? DEFAULT_SETTINGS,
        [settingsProp, kernelState.gridState?.settings]
    );

    const pageConfig = (kernelState.page as Record<string, unknown>)?.config as Record<string, unknown> | undefined;
    const background = (pageConfig?.background as Record<string, unknown>) || {
        color: 'transparent',
        size: 'cover',
        repeat: 'no-repeat',
        attachment: 'scroll'
    };

    // ── ResizeObserver to track container width ───────────────────────────────

    useEffect(() => {
        const el = canvasRef.current;
        if (!el) return;
        const observer = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width ?? 0;
            setContainerWidth(w);
            store.getState().updateGridContainerWidth(w);
        });
        observer.observe(el);
        // Set initial width immediately
        setContainerWidth(el.clientWidth);
        store.getState().updateGridContainerWidth(el.clientWidth);
        return () => observer.disconnect();
    }, [store]);

    // ── Grid layout hook ──────────────────────────────────────────────────────

    const {
        colWidth,
        effectiveCols,
        localPreview,
        onDragStart,
        onDragMove,
        onDragEnd,
        onResizeStart,
        onResizeMove,
        onResizeEnd,
        getPixelRect,
    } = useGridLayout({
        store,
        containerWidth,
        settings: effectiveSettings,
        isGridMode: true,
        zoom,
    });

    // ── Centering / pan state (mirrors GridStackCanvas behavior) ──────────────

    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const panOffsetRef = useRef({ x: 0, y: 0 });
    const isPanningRef = useRef(false);
    const panStartRef = useRef({ x: 0, y: 0 });

    const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const observer = new ResizeObserver((entries) => {
            const r = entries[0]?.contentRect;
            if (r) setCanvasDimensions({ width: r.width, height: r.height });
        });
        observer.observe(el);
        const r = el.getBoundingClientRect();
        setCanvasDimensions({ width: r.width, height: r.height });
        return () => observer.disconnect();
    }, []);

    const centeredPosition = useMemo(() => {
        if (fullWidth) return { x: 0, y: 0 };
        // Editor mode: center the artboard inside the canvas-world div.
        // Canvas world is always at least CANVAS_EDITOR_PADDING larger than the artboard on
        // all sides, so centeredX/Y >= CANVAS_EDITOR_PADDING is guaranteed by construction.
        const artboardW = width ?? canvasDimensions.width;
        const artboardH = height ?? canvasDimensions.height;
        const leftPad = centerPadding?.left ?? 0;
        const rightPad = centerPadding?.right ?? 0;
        const worldW = Math.max(canvasDimensions.width, artboardW * zoom + 2 * CANVAS_EDITOR_PADDING);
        const worldH = Math.max(canvasDimensions.height, artboardH * zoom + 2 * CANVAS_EDITOR_PADDING);
        const usableW = worldW - leftPad - rightPad;
        return {
            x: leftPad + (usableW - artboardW * zoom) / 2 + panOffset.x,
            y: (worldH - artboardH * zoom) / 2 + panOffset.y,
        };
    }, [fullWidth, width, height, centerPadding, canvasDimensions, zoom, panOffset]);

    // ── Wheel zoom ────────────────────────────────────────────────────────────

    const handleWheel = useCallback(
        (e: React.WheelEvent) => {
            if (!onZoomChange || fullWidth) return;
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.05 : 0.05;
                const newZoom = Math.min(2, Math.max(0.1, zoom + delta));
                onZoomChange(Math.round(newZoom * 100));
            }
        },
        [zoom, onZoomChange, fullWidth]
    );

    // ── Mouse down (clear selection + pan) ───────────────────────────────────

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            // Clear selection if clicking on empty canvas
            const target = e.target as Element;
            if (!target.closest('[data-node-id]')) {
                const state = store.getState() as Record<string, unknown>;
                (state.selectNode as ((id: string | null) => void) | undefined)?.(null);
            }

            if ((e.target as Element).closest('[data-grid-tool="pan"]') || !interactive) {
                isPanningRef.current = true;
                panStartRef.current = {
                    x: e.clientX - panOffsetRef.current.x,
                    y: e.clientY - panOffsetRef.current.y,
                };
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.style.cursor = 'grabbing';
                }
            }
        },
        [store, interactive]
    );

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isPanningRef.current) {
                isPanningRef.current = false;
                if (scrollContainerRef.current) scrollContainerRef.current.style.cursor = '';
            }
        };
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!isPanningRef.current) return;
            const nx = e.clientX - panStartRef.current.x;
            const ny = e.clientY - panStartRef.current.y;
            panOffsetRef.current = { x: nx, y: ny };
            setPanOffset({ x: nx, y: ny });
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        window.addEventListener('mousemove', handleGlobalMouseMove);
        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp);
            window.removeEventListener('mousemove', handleGlobalMouseMove);
        };
    }, []);

    // ── Drag-over / drop from ComponentsList ─────────────────────────────────

    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            if (!interactive) return;
            if (e.dataTransfer.types.includes('application/thingsvis-widget')) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
            }
        },
        [interactive]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            if (!interactive || !onDropComponent) return;
            e.preventDefault();
            const data = e.dataTransfer.getData('application/thingsvis-widget');
            if (!data) return;
            try {
                const payload = JSON.parse(data);
                const componentType: string = payload.type ?? payload.remoteName;
                if (!componentType) return;

                const gridEl = canvasRef.current;
                if (!gridEl) return;
                const rect = gridEl.getBoundingClientRect();
                const { x, y } = clientPointToGrid({
                    clientX: e.clientX,
                    clientY: e.clientY,
                    canvasRect: rect,
                    colWidth,
                    cols: effectiveCols,
                    rowHeight: effectiveSettings.rowHeight,
                    gap: effectiveSettings.gap,
                    zoom,
                    itemWidth: 4,
                });
                onDropComponent(componentType, { x, y, w: 4, h: 3 });
            } catch {
                // ignore malformed dataTransfer
            }
        },
        [interactive, onDropComponent, colWidth, effectiveCols, effectiveSettings.rowHeight, effectiveSettings.gap, zoom]
    );

    // ── Selection state ───────────────────────────────────────────────────────

    const selectedIds = kernelState.selection?.nodeIds ?? [];

    const handleSelect = useCallback(
        (nodeId: string) => {
            const state = store.getState() as Record<string, unknown>;
            (state.selectNode as ((id: string) => void) | undefined)?.(nodeId);
        },
        [store]
    );

    // ── Responsive settings (overrides cols with breakpoint-adjusted effectiveCols) ──

    const responsiveSettings = useMemo(
        () => ({ ...effectiveSettings, cols: effectiveCols }),
        [effectiveSettings, effectiveCols]
    );

    // ── Responsive display map: scale + compact to prevent overlaps ───────────
    // When effectiveCols < maxCols (a breakpoint fired), we:
    //   1. Proportionally scale each item's x/w from maxCols → effectiveCols
    //   2. Run GridSystem.compact() to resolve any resulting overlaps by
    //      pushing colliding items down — producing true responsive reflow.
    // At the design-time column count, items render at their authored positions.

    const maxCols = effectiveSettings.cols; // design-time column count (e.g. 24)

    const scaleGridPos = useCallback(
        (raw: { x: number; y: number; w: number; h: number }) => {
            if (effectiveCols === maxCols) return raw;
            // At very narrow breakpoints (≤ 2 cols), force all items to full-width
            // so they are vertically stacked rather than placed side-by-side.
            if (effectiveCols <= 2) {
                return { x: 0, y: raw.y, w: effectiveCols, h: raw.h };
            }
            const scaledW = Math.max(1, Math.round(raw.w * effectiveCols / maxCols));
            const scaledX = Math.min(
                Math.floor(raw.x * effectiveCols / maxCols),
                effectiveCols - scaledW
            );
            return { x: scaledX, y: raw.y, w: scaledW, h: raw.h };
        },
        [effectiveCols, maxCols]
    );

    // ── Visible nodes ─────────────────────────────────────────────────────────

    const nodes = useMemo(
        () =>
            (kernelState.layerOrder as string[])
                .map((id: string) => kernelState.nodesById[id] as NodeState | undefined)
                .filter(
                    (n): n is NodeState =>
                        n != null && n.visible !== false && (n.schemaRef as Record<string, unknown>).grid != null
                ),
        [kernelState.nodesById, kernelState.layerOrder]
    );

    /**
     * nodeId → compacted display position for responsive rendering.
     * null when effectiveCols === maxCols (no reflow needed).
     */
    const compactedDisplayMap = useMemo(() => {
        if (effectiveCols === maxCols || nodes.length === 0) return null;

        const scaledItems = nodes.map((node) => {
            const gridRaw = (node.schemaRef as Record<string, unknown>).grid as
                { x: number; y: number; w: number; h: number };
            const s = scaleGridPos(gridRaw);
            return { id: node.id, x: s.x, y: s.y, w: s.w, h: s.h };
        });

        const result = GridSystem.compact(scaledItems, effectiveCols);
        return Object.fromEntries(result.items.map((item) => [item.id, item]));
    }, [effectiveCols, maxCols, nodes, scaleGridPos]);

    /** Total canvas rows after responsive reflow (used for canvasMinH). */
    const responsiveTotalRows = useMemo(() => {
        if (!compactedDisplayMap) return kernelState.gridState?.totalHeight ?? 0;
        const entries = Object.values(compactedDisplayMap);
        if (entries.length === 0) return 0;
        return Math.max(...entries.map((item) => item.y + item.h));
    }, [compactedDisplayMap, kernelState.gridState?.totalHeight]);

    // ── Theme ─────────────────────────────────────────────────────────────────

    const fallbackTheme = (kernelState.page as any)?.config?.theme;
    const normalizedTheme = validateCanvasTheme(theme || fallbackTheme);

    // ── Render ────────────────────────────────────────────────────────────────

    const canvasW = width ? `${width}px` : '100%';
    const effectiveTotalHeight =
        responsiveTotalRows * (effectiveSettings.rowHeight + effectiveSettings.gap) +
        effectiveSettings.gap;
    const canvasMinH = height ? `${height}px` : `${Math.max(effectiveTotalHeight, 300)}px`;

    const innerCanvas = (
        <div
            ref={canvasRef}
            data-canvas-theme={normalizedTheme}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
                width: canvasW,
                minHeight: canvasMinH,
                position: 'relative',
                backgroundColor: background.color ? String(background.color) : 'hsl(var(--w-canvas-bg, 220 13% 12%))',
                backgroundImage: background.image ? `url(${background.image})` : 'none',
                backgroundSize: background.size ? String(background.size) : 'cover',
                backgroundRepeat: background.repeat ? String(background.repeat) : 'no-repeat',
                backgroundAttachment: background.attachment ? String(background.attachment) : 'scroll',
                boxSizing: 'border-box',
                // Bottom breathing room: add padding so the last row of widgets is not flush
                // with the canvas bottom edge (only relevant in fluid editor mode).
                paddingBottom: (!fullWidth && !width) ? CANVAS_EDITOR_PADDING : 0,
                ...(fullWidth ? {} : { boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }),
            }}
        >
            {/* Grid line background */}
            {(showGridLinesProp ?? effectiveSettings.showGridLines) && colWidth > 0 && (
                <GridCanvasBackground
                    cols={effectiveCols}
                    colWidth={colWidth}
                    rowHeight={effectiveSettings.rowHeight}
                    gap={effectiveSettings.gap}
                    totalHeight={Math.max(effectiveTotalHeight, height ?? Math.max(canvasDimensions.height, 600))}
                    containerWidth={containerWidth}
                />
            )}

            {/* Widget nodes */}
            {nodes.map((node: NodeState) => {
                const schema = node.schemaRef as Record<string, unknown>;
                const gridRaw = schema.grid as { x: number; y: number; w: number; h: number };
                // Use compacted display position when in a responsive breakpoint,
                // otherwise fall back to authored grid position.
                const displayGrid = compactedDisplayMap
                    ? (compactedDisplayMap[node.id] ?? scaleGridPos(gridRaw))
                    : gridRaw;
                const pixelRect = gridToPixel(displayGrid, responsiveSettings, containerWidth);

                let pushedRect = null;
                const pushedData = localPreview?.pushedItems?.[node.id];
                if (pushedData) {
                    pushedRect = gridToPixel(scaleGridPos(pushedData), responsiveSettings, containerWidth);
                }

                return (
                    <GridNodeItem
                        key={node.id}
                        nodeId={node.id}
                        pixelRect={pixelRect}
                        previewPixelRect={pushedRect}
                        store={store}
                        resolveWidget={resolveWidget}
                        interactive={interactive}
                        isSelected={selectedIds.includes(node.id)}
                        theme={normalizedTheme}
                        widgetMode={widgetMode}
                        zoom={zoom}
                        onDragStart={onDragStart}
                        onDragMove={onDragMove}
                        onDragEnd={onDragEnd}
                        onResizeStart={onResizeStart as (nodeId: string, handle: ResizeHandle) => void}
                        onResizeMove={onResizeMove}
                        onResizeEnd={onResizeEnd}
                        onSelect={handleSelect}
                    />
                );
            })}

            {/* Drop placeholder during drag */}
            {(localPreview?.active || kernelState.gridState?.preview?.active) && (
                <GridDropTarget
                    // Use localPreview first for smooth inline interactions, fallback to kernelState for cross-pane drops.
                    preview={localPreview ? (localPreview as any) : kernelState.gridState?.preview!}
                    settings={effectiveSettings}
                    containerWidth={containerWidth}
                />
            )}
        </div>
    );

    return (
        <div
            ref={scrollContainerRef}
            className={`theme-${normalizedTheme}`}
            onMouseDown={handleMouseDown}
            onWheel={handleWheel}
            style={{
                width: '100%',
                // In fullWidth (preview/embed) mode, allow content to grow beyond viewport
                // so the parent container can scroll. In editor mode, clip to viewport area.
                height: fullWidth ? undefined : '100%',
                minHeight: fullWidth ? '100%' : undefined,
                overflow: fullWidth ? 'visible' : 'auto',
                position: 'relative',
                // Outer container is always transparent — background comes from
                // the page config (innerCanvas) or the host wrapper, never hardcoded here.
                backgroundColor: 'transparent',
            }}
        >
            {fullWidth ? (
                // Full-width embed/preview mode: no zoom transform, no centering.
                <div style={{ width: '100%', minHeight: canvasMinH }}>{innerCanvas}</div>
            ) : (
                // Editor mode: canvas-world pattern.
                // The world div is sized to always be larger than the zoomed artboard by
                // CANVAS_EDITOR_PADDING on every side. Setting an explicit pixel size on this
                // in-flow div lets overflow:auto on the scroll container create scrollbars
                // automatically when the workspace is too small — unlike abs-positioned
                // children which don't contribute to the scroll area.
                <div style={{
                    position: 'relative',
                    width: Math.max(canvasDimensions.width, (width ?? canvasDimensions.width) * zoom + 2 * CANVAS_EDITOR_PADDING),
                    height: Math.max(canvasDimensions.height, (height ?? canvasDimensions.height) * zoom + 2 * CANVAS_EDITOR_PADDING),
                    flexShrink: 0,
                }}>
                    <div
                        style={{
                            position: 'absolute',
                            left: centeredPosition.x,
                            top: centeredPosition.y,
                            transform: `scale(${zoom})`,
                            transformOrigin: '0 0',
                        }}
                    >
                        {innerCanvas}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GridCanvas;
