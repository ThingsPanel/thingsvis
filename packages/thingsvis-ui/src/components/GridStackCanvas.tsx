/**
 * GridStackCanvas - Grid layout canvas using gridstack.js
 * 
 * Based on official gridstack.js React integration pattern.
 * @see https://github.com/gridstack/gridstack.js/blob/master/demo/react.html
 */

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useSyncExternalStore } from 'react';
import { GridStack } from 'gridstack';
import type { KernelStore, KernelState, NodeState } from '@thingsvis/kernel';
import type { GridSettings, PluginOverlayContext } from '@thingsvis/schema';

export interface GridStackCanvasProps {
  store: KernelStore;
  settings?: GridSettings;
  resolvePlugin?: (type: string) => Promise<any>;
  onNodeChange?: (nodeId: string, position: { x: number; y: number; w: number; h: number }) => void;
  onDropComponent?: (componentType: string, gridPosition: { x: number; y: number; w: number; h: number }) => void;
  /** Fixed width in pixels, or undefined for 100% */
  width?: number;
  /** Fixed height in pixels, or undefined for 100% */
  height?: number;
}

// Cache for loaded plugins
const pluginCache = new Map<string, any>();
// Track which nodes have been rendered with plugins
const renderedOverlays = new Map<string, { update?: (ctx: PluginOverlayContext) => void; destroy?: () => void }>();

function nodeToOverlayContext(node: NodeState, store: KernelStore): PluginOverlayContext {
  const schema = node.schemaRef as any;
  return {
    position: schema.position ?? { x: 0, y: 0 },
    size: schema.size ?? { width: 200, height: 100 },
    props: schema.props ?? {}
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
  resolvePlugin,
  onNodeChange,
  onDropComponent,
  width,
  height,
}) => {
  const gridRef = useRef<GridStack | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Subscribe to store state
  const kernelState = useSyncExternalStore(
    useCallback((subscribe) => store.subscribe(subscribe), [store]),
    () => store.getState() as KernelState,
    () => store.getState() as KernelState
  );

  // Memoize nodes array
  const nodes = useMemo(() => 
    Object.values(kernelState.nodesById), 
    [kernelState.nodesById]
  );

  // Default grid settings
  const cols = settings?.cols ?? 12;
  const rowHeight = settings?.rowHeight ?? 10;
  const gap = settings?.gap ?? 5;

  // Handle drop from external drag source (ComponentsList)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/thingsvis-plugin')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/thingsvis-plugin');
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

      console.log('[GridStackCanvas] Drop:', componentType, 'at grid position:', { x, y });
      
      onDropComponent(componentType, { x, y, w: 4, h: 3 });
    } catch (err) {
      console.error('[GridStackCanvas] Drop error:', err);
    }
  }, [onDropComponent, cols, rowHeight]);

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
        margin: gap,
        float: true, // Allow overlapping - widgets can be placed anywhere
        animate: false,
        disableOneColumnMode: true,
        staticGrid: false,
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
    grid.margin(gap);
  }, [cols, rowHeight, gap]);

  // Sync nodes with gridstack using makeWidget
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) {
      console.log('[GridStackCanvas] Grid not initialized yet');
      return;
    }

    console.log('[GridStackCanvas] Syncing nodes:', nodes.length);

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

      console.log('[GridStackCanvas] Adding widget:', node.id, 'grid:', { x, y, w, h }, 'type:', nodeType);

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
      contentEl.style.cssText = 'background:#fff;border:1px solid #e0e0e0;overflow:hidden;';
      
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
      
      // Load and render the actual plugin
      if (resolvePlugin) {
        loadAndRenderPlugin(node, nodeType, contentEl);
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
        if (el) grid.removeWidget(el, false);
      }
    });
  }, [nodes, resolvePlugin]);

  // Function to load plugin and render overlay
  const loadAndRenderPlugin = useCallback(async (node: NodeState, nodeType: string, contentEl: HTMLElement) => {
    if (!resolvePlugin) return;
    
    try {
      // Check cache first
      let plugin = pluginCache.get(nodeType);
      if (!plugin) {
        plugin = await resolvePlugin(nodeType);
        pluginCache.set(nodeType, plugin);
      }

      // Clear loading placeholder
      contentEl.innerHTML = '';

      // If plugin has createOverlay, use it
      if (plugin.createOverlay) {
        const context = nodeToOverlayContext(node, store);
        const overlay = plugin.createOverlay(context);
        
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
      console.error('[GridStackCanvas] Failed to load plugin:', nodeType, err);
      contentEl.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#e53e3e;font-size:12px;">Error: ${nodeType}</div>`;
    }
  }, [resolvePlugin, store]);

  // Use fixed dimensions or fill container
  const containerWidth = width ? `${width}px` : '100%';
  const containerHeight = height ? `${height}px` : '100%';

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%',
        overflow: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '20px',
        boxSizing: 'border-box',
        background: '#e5e5e5',
      }}
    >
      <div 
        ref={containerRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{ 
          width: containerWidth, 
          minHeight: containerHeight,
          background: '#fff',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
      >
        {/* The grid-stack container - GridStack will initialize on this */}
        <div className="grid-stack" style={{ minHeight: containerHeight }} />
      </div>
    </div>
  );
};

export default GridStackCanvas;
