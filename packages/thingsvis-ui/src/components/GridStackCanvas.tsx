/**
 * GridStackCanvas - Grid layout canvas using gridstack.js
 * 
 * Based on official gridstack.js React integration pattern.
 * @see https://github.com/gridstack/gridstack.js/blob/master/demo/react.html
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useSyncExternalStore } from 'react';
import { GridStack } from 'gridstack';
import type { KernelStore, KernelState, NodeState } from '@thingsvis/kernel';
import { validateCanvasTheme } from '@thingsvis/schema';
import type { GridSettings, WidgetOverlayContext } from '@thingsvis/schema';
import { PropertyResolver } from '../engine/PropertyResolver';
import { usePlatformData } from '../hooks/usePlatformData';

export interface GridStackCanvasProps {
  store: KernelStore;
  settings?: GridSettings;
  resolveWidget?: (type: string) => Promise<any>;
  onNodeChange?: (nodeId: string, position: { x: number; y: number; w: number; h: number }) => void;
  onDropComponent?: (componentType: string, gridPosition: { x: number; y: number; w: number; h: number }) => void;
  /** Fixed width in pixels, or undefined for 100% */
  width?: number;
  /** Fixed height in pixels, or undefined for 100% */
  height?: number;
  /** Current active tool */
  activeTool?: string;
  /** Enable interactions (drag/resize/select/drop). Defaults to true. */
  interactive?: boolean;
  /** Full-width mode for preview (no shadow, white background, fills container) */
  fullWidth?: boolean;
  /** Zoom level (0-1), defaults to 1 */
  zoom?: number;
  /** Callback when zoom changes */
  onZoomChange?: (zoom: number) => void;
  /** Canvas Theme Setup (dawn | midnight) */
  theme?: string;
  /** Padding for centering calculation (to account for side panels) */
  centerPadding?: { left?: number; right?: number };
}

// Cache for loaded widgets
const widgetCache = new Map<string, any>();
// Track which nodes have been rendered with widgets
const renderedOverlays = new Map<string, { update?: (ctx: WidgetOverlayContext) => void; destroy?: () => void }>();

function nodeToOverlayContext(
  node: NodeState,
  store: KernelStore,
  platformData?: Record<string, any>,
  theme?: string,
  interactive?: boolean,
): WidgetOverlayContext {
  const schema = node.schemaRef as any;
  // 使用 PropertyResolver 解析绑定表达式（支持数据源绑定和Platform字段绑定）
  const resolvedProps = PropertyResolver.resolve(node, store.getState().dataSources, platformData);
  const mode: WidgetOverlayContext['mode'] = interactive !== false ? 'view' : 'view';
  return {
    position: schema.position ?? { x: 0, y: 0 },
    size: schema.size ?? { width: 200, height: 100 },
    props: resolvedProps,
    theme,
    mode,
    locale: (typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en'),
    visible: true,
    emit: (_event: string, _payload?: unknown) => { /* TASK-23: action system */ },
    on: (_event: string, _handler: (payload?: unknown) => void) => () => {},
  };
}

/**
 * GridStackCanvas component
 * 
 * Renders nodes in a gridstack layout with drag and resize support.
 * Uses the official pattern from gridstack.js React demos.
 */
export const GridStackCanvas: React.FC<GridStackCanvasProps> = ({
  store,
  settings,
  resolveWidget,
  onNodeChange,
  onDropComponent,
  width,
  height,
  activeTool,
  interactive = true,
  fullWidth = false,
  zoom = 1,
  onZoomChange,
  theme = 'dawn',
  centerPadding,
}) => {
  const gridRef = useRef<GridStack | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Subscribe to store state
  const kernelState = useSyncExternalStore(
    useCallback((subscribe) => store.subscribe(subscribe), [store]),
    () => store.getState() as KernelState,
    () => store.getState() as KernelState
  );

  // Subscribe to platform data changes for {{ platform.xxx }} expressions
  const platformData = usePlatformData();

  // Always derive nodes from the latest state to reflect binding updates.
  const nodes = Object.values(kernelState.nodesById);

  // Default grid settings
  const cols = settings?.cols ?? 12;
  const rowHeight = settings?.rowHeight ?? 50;
  const gap = settings?.gap ?? 5;
  // GridStack applies margin to all sides, so use half to get the desired gap between widgets
  const margin = gap / 2;

  // Handle drop from external drag source (ComponentsList)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!interactive) return;
    if (e.dataTransfer.types.includes('application/thingsvis-widget')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  }, [interactive]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (!interactive) return;
    e.preventDefault();
    const data = e.dataTransfer.getData('application/thingsvis-widget');
    if (!data || !onDropComponent) return;

    try {
      const payload = JSON.parse(data);
      const componentType = payload.type || payload.remoteName;

      // Calculate grid position from drop coordinates
      const grid = gridRef.current;
      const gridEl = containerRef.current?.querySelector('.grid-stack');
      if (!grid || !gridEl) return;

      const rect = gridEl.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top + gridEl.scrollTop;

      // Convert to grid units, clamped to valid range
      const cellWidth = rect.width / cols;
      const x = Math.max(0, Math.min(cols - 4, Math.floor(relX / cellWidth)));
      const y = Math.max(0, Math.floor(relY / rowHeight));



      onDropComponent(componentType, { x, y, w: 4, h: 3 });
    } catch (err) {

    }
  }, [interactive, onDropComponent, cols, rowHeight]);

  // Store callbacks in refs to avoid re-initialization
  const onNodeChangeRef = useRef(onNodeChange);
  onNodeChangeRef.current = onNodeChange;

  // Initialize GridStack only once on mount
  useEffect(() => {
    // Find the grid-stack element
    const gridEl = containerRef.current?.querySelector('.grid-stack');
    if (!gridEl) return;

    // Initialize only once
    if (!gridRef.current) {
      gridRef.current = GridStack.init({
        column: cols,
        cellHeight: rowHeight,
        margin: margin,
        float: true, // Allow overlapping - widgets can be placed anywhere
        animate: false,
        // @ts-expect-error: disableOneColumnMode removed in newer gridstack types but still works at runtime
        disableOneColumnMode: true,
        staticGrid: !interactive,
        disableDrag: !interactive,
        disableResize: !interactive,
        // Prevent collision resolution issues
        acceptWidgets: true,
        removable: false,
        // Default max row count
        maxRow: 100,
        // Minimum widget size
        minW: 1,
        minH: 1,
      }, gridEl as HTMLElement);

      // Listen for drag/resize stop events
      gridRef.current.on('dragstop resizestop', (_event: any, el: any) => {
        const node = el.gridstackNode;
        if (node && node.id && onNodeChangeRef.current) {
          onNodeChangeRef.current(node.id, {
            x: node.x ?? 0,
            y: node.y ?? 0,
            w: node.w ?? 1,
            h: node.h ?? 1,
          });
        }
      });
    }

    return () => {
      if (gridRef.current) {
        gridRef.current.destroy(false);
        gridRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initialize only on mount

  // Update grid settings dynamically when they change
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    // Update column count
    grid.column(cols, 'none'); // 'none' prevents re-layout

    // Update cell height
    grid.cellHeight(rowHeight);

    // Update margin/gap
    grid.margin(margin);
  }, [cols, rowHeight, gap, margin]);

  // Update interactive state dynamically
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    // Enable/disable drag and resize based on interactive prop
    grid.enableMove(interactive);
    grid.enableResize(interactive);
    grid.setStatic(!interactive);
  }, [interactive]);

  // Sync nodes with gridstack using makeWidget
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) {

      return;
    }



    // Get existing widget IDs
    const existingIds = new Set<string>();
    grid.getGridItems().forEach((el: HTMLElement) => {
      const id = el.getAttribute('gs-id');
      if (id) existingIds.add(id);
    });

    // Add new nodes as widgets
    nodes.forEach((node) => {
      if (existingIds.has(node.id)) return;

      const schema = node.schemaRef as any;
      // grid is directly on schemaRef
      const gridPos = schema?.grid ?? { x: 0, y: 0, w: 4, h: 3 };
      const nodeType = schema?.type || 'unknown';

      // Ensure valid grid position values
      const x = Math.max(0, Math.min(cols - 1, gridPos.x ?? 0));
      const y = Math.max(0, gridPos.y ?? 0);
      const w = Math.max(1, Math.min(cols - x, gridPos.w ?? 4));
      const h = Math.max(1, gridPos.h ?? 3);



      // Create widget element with gs-* attributes (v11+ API)
      const itemEl = document.createElement('div');
      itemEl.className = 'grid-stack-item';
      // Set position attributes before adding to DOM
      itemEl.setAttribute('gs-id', node.id);
      itemEl.setAttribute('gs-x', String(x));
      itemEl.setAttribute('gs-y', String(y));
      itemEl.setAttribute('gs-w', String(w));
      itemEl.setAttribute('gs-h', String(h));
      itemEl.setAttribute('gs-min-w', '1');
      itemEl.setAttribute('gs-min-h', '1');

      const contentEl = document.createElement('div');
      contentEl.className = 'grid-stack-item-content';
      contentEl.style.cssText = 'background:#fff;border:1px solid #e0e0e0;overflow:hidden;cursor:pointer;';

      // Track if this is a click (mousedown + mouseup without much movement)
      let mouseDownPos: { x: number; y: number } | null = null;

      itemEl.addEventListener('mousedown', (e) => {
        mouseDownPos = { x: e.clientX, y: e.clientY };
      });

      itemEl.addEventListener('mouseup', (e) => {
        if (!mouseDownPos) return;
        const dx = Math.abs(e.clientX - mouseDownPos.x);
        const dy = Math.abs(e.clientY - mouseDownPos.y);
        mouseDownPos = null;

        // If mouse didn't move much, treat as click
        if (interactive && dx < 5 && dy < 5) {
          e.stopPropagation();
          // Select this node in the store
          (store.getState() as any).selectNode(node.id);
        }
      });

      // Show loading placeholder initially
      contentEl.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#999;font-size:12px;">Loading ${nodeType}...</div>`;

      itemEl.appendChild(contentEl);

      // Append to grid container first, then make it a widget (v11+ pattern)
      const gridEl = containerRef.current?.querySelector('.grid-stack');
      if (gridEl) {
        gridEl.appendChild(itemEl);
        // Use makeWidget for v11+ - it reads position from gs-* attributes
        grid.makeWidget(itemEl);
      }

      // Load and render the actual widget
      if (resolveWidget) {
        loadAndRenderWidget(node, nodeType, contentEl);
      }
    });

    // Remove deleted nodes
    const nodeIds = new Set(nodes.map(n => n.id));
    existingIds.forEach(id => {
      if (!nodeIds.has(id)) {
        // Clean up overlay
        const overlay = renderedOverlays.get(id);
        if (overlay?.destroy) overlay.destroy();
        renderedOverlays.delete(id);

        const el = grid.getGridItems().find((item: HTMLElement) => item.getAttribute('gs-id') === id);
        if (el) grid.removeWidget(el, true);
      }
    });
  }, [nodes, resolveWidget]);

  // Function to load widget and render overlay
  const loadAndRenderWidget = useCallback(async (node: NodeState, nodeType: string, contentEl: HTMLElement) => {
    if (!resolveWidget) return;

    try {
      // Check cache first
      let widget = widgetCache.get(nodeType);
      if (!widget) {
        widget = await resolveWidget(nodeType);
        widgetCache.set(nodeType, widget);
      }

      // Clear loading placeholder
      contentEl.innerHTML = '';

      // If widget has createOverlay, use it
      if (widget.createOverlay) {
        const context = nodeToOverlayContext(node, store, platformData, theme, interactive);
        const overlay = widget.createOverlay(context);

        if (overlay.element) {
          overlay.element.style.width = '100%';
          overlay.element.style.height = '100%';
          contentEl.appendChild(overlay.element);

          // Store for updates/cleanup
          renderedOverlays.set(node.id, {
            update: overlay.update,
            destroy: overlay.destroy,
          });
        }
      } else {
        // Fallback: show type name
        contentEl.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:14px;color:#333;">${nodeType}</div>`;
      }
    } catch (err) {

      contentEl.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#e53e3e;font-size:12px;">Error: ${nodeType}</div>`;
    }
  }, [resolveWidget, store, platformData, theme]);

  // Update existing overlays when node props change (for data source and platform data updates)
  // Note: We watch dataSources and platformData explicitly since props may contain bindings
  useEffect(() => {
    nodes.forEach((node: any) => {
      const overlay = renderedOverlays.get(node.id);
      if (overlay?.update) {
        const context = nodeToOverlayContext(node, store, platformData, theme, interactive);
        overlay.update(context);
      }
    });
  }, [nodes, store, kernelState.dataSources, platformData, theme]);

  // Use fixed dimensions or fill container
  const containerWidth = width ? `${width}px` : '100%';
  const containerHeight = height ? `${height}px` : '100%';

  // Pan state for dragging canvas using transform
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = React.useState({ x: 0, y: 0 });
  const panOffsetRef = useRef({ x: 0, y: 0 });

  // Container dimensions for centering calculation
  const [containerDimensions, setContainerDimensions] = React.useState({ width: 0, height: 0 });

  // Update container dimensions on mount and resize
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const updateDimensions = () => {
      if (scrollContainerRef.current) {
        const r = scrollContainerRef.current.getBoundingClientRect();
        setContainerDimensions({ width: r.width, height: r.height });
      }
    };
    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(scrollContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Calculate centered position based on container dimensions and padding
  const centeredPosition = React.useMemo(() => {
    const leftPad = centerPadding?.left ?? 0;
    const rightPad = centerPadding?.right ?? 0;
    const visibleWidth = containerDimensions.width - leftPad - rightPad;
    const canvasWidth = width || 0;
    const canvasHeight = height || 0;

    // Calculate offset to center within visible area
    const offsetX = leftPad + (visibleWidth - canvasWidth * zoom) / 2;
    const offsetY = (containerDimensions.height - canvasHeight * zoom) / 2;

    return {
      x: offsetX + panOffset.x,
      y: offsetY + panOffset.y
    };
  }, [containerDimensions, width, height, zoom, panOffset, centerPadding]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Click on empty area clears selection (avoid clearing when clicking a widget)
    const target = e.target as Element | null;
    const clickedWidget = target?.closest?.('.grid-stack-item');
    if (!clickedWidget) {
      (store.getState() as any).selectNode(null);
    }

    if (activeTool !== 'pan') return;

    // Prevent gridstack from handling this event
    e.stopPropagation();
    e.preventDefault();

    isPanningRef.current = true;
    panStartRef.current = {
      x: e.clientX - panOffsetRef.current.x,
      y: e.clientY - panOffsetRef.current.y,
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.style.cursor = 'grabbing';
    }
  }, [activeTool]);

  // Use window-level mouse events for reliable pan
  useEffect(() => {
    if (activeTool !== 'pan') return;

    const handleGlobalMouseUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        const container = scrollContainerRef.current;
        if (container) {
          container.style.cursor = 'grab';
        }
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isPanningRef.current) return;

      const newX = e.clientX - panStartRef.current.x;
      const newY = e.clientY - panStartRef.current.y;

      panOffsetRef.current = { x: newX, y: newY };
      setPanOffset({ x: newX, y: newY });
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [activeTool]);

  // Disable gridstack drag/resize when pan tool is active
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    if (activeTool === 'pan') {
      grid.disable(); // Disable all grid interactions
    } else {
      grid.enable(); // Re-enable grid interactions
    }
  }, [activeTool]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!onZoomChange || fullWidth) return;

    // Use Ctrl+wheel or pinch gesture for zoom
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      const newZoom = Math.min(2, Math.max(0.25, zoom + delta));
      onZoomChange(newZoom);
    }
  }, [zoom, onZoomChange, fullWidth]);

  // Normalize theme via registry
  const normalizedTheme = validateCanvasTheme(theme);

  return (
    <div
      ref={scrollContainerRef}
      className={`theme-${normalizedTheme} ${interactive ? 'gs-interactive-container' : ''}`}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        background: fullWidth ? 'hsl(var(--w-bg))' : 'hsl(var(--w-canvas-bg))',
        cursor: activeTool === 'pan' ? 'grab' : 'default',
        userSelect: activeTool === 'pan' ? 'none' : 'auto',
      }}
    >
      {
        fullWidth ? (
          /* Full-width mode: no centering, no shadow, fills container */
          <div
            ref={containerRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              width: '100%',
              minHeight: containerHeight,
              background: 'hsl(var(--w-bg))',
              overflow: 'hidden',
              padding: `${margin}px`,
              boxSizing: 'border-box',
            }}
          >
            <div className="grid-stack" style={{ minHeight: `calc(${containerHeight} - ${margin * 2}px)` }} />
          </div>
        ) : (
          /* Normal mode: centered with shadow and zoom support */
          <div
            style={{
              position: 'absolute',
              left: centeredPosition.x,
              top: centeredPosition.y,
              transform: `scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            <div
              ref={containerRef}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              style={{
                width: containerWidth,
                minHeight: containerHeight,
                background: 'hsl(var(--w-bg))',
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                overflow: 'hidden',
                padding: `${margin}px`,
                boxSizing: 'border-box',
              }}
            >
              <div className="grid-stack" style={{ minHeight: `calc(${containerHeight} - ${margin * 2}px)` }} />
            </div>
          </div>
        )}
      {interactive && (
        <style>{`
          .gs-interactive-container .grid-stack-item-content > * {
            pointer-events: none !important;
          }
        `}</style>
      )}
    </div>
  );
};

export default GridStackCanvas;
