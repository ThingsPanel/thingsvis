import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSyncExternalStore } from 'react';
import type { KernelStore, KernelState } from '@thingsvis/kernel';
import { validateCanvasTheme } from '@thingsvis/schema';
import type { ActionRuntime } from '../engine/executeActions';
import { VisualEngine } from '../engine/VisualEngine';
import { snapPointToGrid } from '../utils/snapping';
import type { Point } from '../utils/coords';
import { calculateScaleToFit } from '../modes/mode-controller';
import { resolveCanvasBackgroundStyle } from '../utils/canvasBackgroundStyle';

type Mode = 'fixed' | 'infinite' | 'grid';

type Props = {
  store: KernelStore;
  resolveWidget?: (type: string) => Promise<any>;
  locale?: string;
  mode?: Mode;
  width?: number;
  height?: number;
  gridSize?: number;
  snapToGrid?: boolean;
  showGridLines?: boolean;
  centeredMask?: boolean;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  onViewportChange?: (vp: { width: number; height: number; zoom: number; offsetX: number; offsetY: number }) => void;
  /** Enable panning (dragging the canvas / wheel panning) */
  panEnabled?: boolean;
  /** Enable zooming (Ctrl/Meta + wheel zoom) */
  zoomEnabled?: boolean;
  /** Enable component interaction (dragging etc) */
  interactive?: boolean;
  /** Padding for centering calculation (to account for side panels) */
  centerPadding?: { left?: number; right?: number };
  actionRuntime?: ActionRuntime;
};

export const CanvasView: React.FC<Props> = ({
  store,
  resolveWidget,
  locale,
  mode: propsMode,
  width: propsWidth,
  height: propsHeight,
  gridSize = 16,
  snapToGrid = false,
  showGridLines = true,
  centeredMask = true,
  zoom: propsZoom,
  onZoomChange,
  onViewportChange,
  panEnabled = true,
  zoomEnabled = true,
  interactive = true,
  centerPadding,
  actionRuntime,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VisualEngine>();
  const gridCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync with store state
  const kernelState = useSyncExternalStore(
    useCallback((subscribe) => store.subscribe(subscribe), [store]),
    () => store.getState() as KernelState,
    () => store.getState() as KernelState
  );

  const mode = propsMode || kernelState.canvas.mode || 'infinite';
  const width = propsWidth || kernelState.canvas.width || 1920;
  const height = propsHeight || kernelState.canvas.height || 1080;

  const pageConfig = (kernelState.page as any)?.config || {};
  const background = pageConfig.background || {};
  const normalizedTheme = validateCanvasTheme(pageConfig.theme);
  const backgroundStyle = resolveCanvasBackgroundStyle(background);

  const [internalZoom, setInternalZoom] = useState(1);
  // We use external zoom if provided (works for both fixed and grid modes)
  const zoom = propsZoom !== undefined ? propsZoom : internalZoom;
  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const setZoomValue = useCallback(
    (nextZoom: number) => {
      // Always update internal zoom
      setInternalZoom(nextZoom);
      // Notify external if callback provided
      if (onZoomChange) {
        onZoomChange(nextZoom);
      }
    },
    [onZoomChange, mode]
  );

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hasUserPanned, setHasUserPanned] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // Update container dimensions on mount and resize
  useEffect(() => {
    if (!containerRef.current) return;
    const updateDimensions = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width: r.width, height: r.height });
      }
    };
    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Initial auto-fit for fixed and grid modes
  const [hasAutoFit, setHasAutoFit] = useState(false);
  useEffect(() => {
    if ((mode === 'fixed' || mode === 'grid') && containerDimensions.width > 0 && !hasAutoFit && propsZoom === undefined) {
      const leftPad = centerPadding?.left ?? 0;
      const rightPad = centerPadding?.right ?? 0;
      const visibleWidth = containerDimensions.width - leftPad - rightPad;
      const initialZoom = calculateScaleToFit(visibleWidth, containerDimensions.height, width, height, 40, mode === 'grid');
      setInternalZoom(initialZoom);
      setHasAutoFit(true);
    }
  }, [mode, containerDimensions, width, height, hasAutoFit, propsZoom, centerPadding]);

  useEffect(() => {
    if (mode !== 'fixed' && mode !== 'grid') {
      setHasUserPanned(false);
      return;
    }
    if (containerDimensions.width <= 0 || containerDimensions.height <= 0) return;
    if (hasUserPanned) return;
    const leftPad = centerPadding?.left ?? 0;
    const rightPad = centerPadding?.right ?? 0;
    // Calculate center based on visible area (excluding side panels)
    const visibleWidth = containerDimensions.width - leftPad - rightPad;
    const nextOffset = {
      x: leftPad + (visibleWidth - width * zoom) / 2,
      y: (containerDimensions.height - height * zoom) / 2
    };
    setOffset((prev) => (
      prev.x === nextOffset.x && prev.y === nextOffset.y ? prev : nextOffset
    ));
  }, [mode, containerDimensions, width, height, zoom, hasUserPanned, centerPadding]);

  const viewportInfo = useMemo(() => {
    return { zoom, offset };
  }, [zoom, offset]);

  // Debug: log when zoom changes in grid mode
  useEffect(() => {
    if (mode === 'grid') {

    }
  }, [mode, zoom, internalZoom, offset]);

  const drawGrid = useCallback(() => {
    const canvas = gridCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!showGridLines) return;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;

    const { zoom: vZoom, offset: vOffset } = viewportInfo;
    let stepX = gridSize * vZoom;
    let stepY = gridSize * vZoom;

    // Grid mode: GridCanvasBackground SVG component inside GridCanvas already draws grid lines,
    // so we must NOT draw a second canvas grid here to avoid double lines.
    if (mode === 'grid') {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    if (stepX <= 0 || stepY <= 0) return;

    // Determine grid drawing area based on mode
    let startX: number, startY: number, endX: number, endY: number;

    if (mode === 'fixed') {
      startX = Math.max(0, vOffset.x);
      startY = Math.max(0, vOffset.y);
      endX = Math.min(rect.width, vOffset.x + width * vZoom);
      endY = Math.min(rect.height, vOffset.y + height * vZoom);
    } else {
      startX = 0;
      startY = 0;
      endX = rect.width;
      endY = rect.height;
    }

    const originX = vOffset.x % stepX;
    const originY = vOffset.y % stepY;

    // Draw vertical grid lines only within the defined area
    for (let x = originX; x < endX; x += stepX) {
      if (x >= startX) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, startY);
        ctx.lineTo(x + 0.5, endY);
        ctx.stroke();
      }
    }

    // Draw horizontal grid lines only within the defined area
    for (let y = originY; y < endY; y += stepY) {
      if (y >= startY) {
        ctx.beginPath();
        ctx.moveTo(startX, y + 0.5);
        ctx.lineTo(endX, y + 0.5);
        ctx.stroke();
      }
    }
  }, [gridSize, viewportInfo, mode, width, height, showGridLines]);

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  useEffect(() => {
    const handleResize = () => drawGrid();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawGrid]);

  useEffect(() => {
    if (!containerRef.current) return;
    const mountEl = containerRef.current.querySelector('#visual-engine-mount') as HTMLDivElement | null;
    const engine = new VisualEngine(store, {
      resolveWidget,
      editable: interactive,
      actionRuntime,
      locale,
    });
    engineRef.current = engine;
    engine.mount(mountEl ?? containerRef.current);
    return () => {
      engine.unmount();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionRuntime, locale, store, resolveWidget]);

  // Update interactivity dynamically without fully remixing the engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setEditable(interactive);
    }
  }, [interactive]);

  // Update VisualEngine viewport when zoom/offset changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setViewport(zoom, offset.x, offset.y);
    }
  }, [zoom, offset]);

  // pan handling (infinite mode)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let isPanning = false;
    let lastX = 0;
    let lastY = 0;

    function onPointerDown(e: PointerEvent) {
      if (mode !== 'infinite' && mode !== 'fixed' && mode !== 'grid') return;
      if (!panEnabled) return;
      isPanning = true;
      lastX = e.clientX;
      lastY = e.clientY;
      (e.target as Element).setPointerCapture?.(e.pointerId);
    }
    function onPointerMove(e: PointerEvent) {
      if (!isPanning) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
      if (mode === 'fixed' || mode === 'grid') {
        setHasUserPanned(true);
      }
    }
    function onPointerUp(e: PointerEvent) {
      isPanning = false;
      try { (e.target as Element).releasePointerCapture?.(e.pointerId); } catch { /* pointer already released */ }
    }

    function onWheel(e: WheelEvent) {
      if (mode !== 'infinite' && mode !== 'fixed' && mode !== 'grid') return;

      // If Ctrl/Meta is pressed, it's a zoom action
      if (e.ctrlKey || e.metaKey) {
        if (!zoomEnabled) return;
        e.preventDefault();
        const delta = -e.deltaY;
        const factor = delta > 0 ? 1.1 : 0.9;
        const next = Math.max(0.1, Math.min(10, zoomRef.current * factor));
        setZoomValue(next);
      } else if (mode === 'infinite' || mode === 'fixed' || mode === 'grid') {
        if (!panEnabled) return;
        // Panning via wheel (standard scroll)
        setOffset((o) => ({ x: o.x - e.deltaX, y: o.y - e.deltaY }));
        if (mode === 'fixed' || mode === 'grid') {
          setHasUserPanned(true);
        }
      }
    }

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('wheel', onWheel as any);
    };
  }, [mode, setZoomValue, panEnabled, zoomEnabled]);

  // redraw grid when viewport changes
  useEffect(() => {
    const { zoom: vZoom, offset: vOffset } = viewportInfo;
    onViewportChange?.({
      width,
      height,
      zoom: vZoom,
      offsetX: vOffset.x,
      offsetY: vOffset.y
    });
  }, [viewportInfo, onViewportChange, width, height]);

  // helper to convert screen -> world (used by parent if needed)
  function screenToWorld(screenPoint: Point): Point {
    const { zoom: vZoom, offset: vOffset } = viewportInfo;
    return {
      x: (screenPoint.x - vOffset.x) / vZoom,
      y: (screenPoint.y - vOffset.y) / vZoom
    };
  }

  const maskStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: 'transparent',
    pointerEvents: 'none',
    zIndex: 10
  };

  const { zoom: vZoom, offset: vOffset } = viewportInfo;

  // Fixed/Grid mode border/shadow
  const canvasOutlineStyle: React.CSSProperties = (mode === 'fixed' || mode === 'grid') ? {
    position: 'absolute',
    left: vOffset.x,
    top: vOffset.y,
    width: width * vZoom,
    height: height * vZoom,
    boxShadow: '0 0 10px rgba(0,0,0,0.2)',
    pointerEvents: 'none',
    zIndex: 11
  } : {};

  return (
    <div
      ref={containerRef}
      data-canvas-theme={normalizedTheme}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        ...(mode === 'infinite'
          ? backgroundStyle
          : {
              backgroundColor: 'hsl(var(--workspace-bg))',
              backgroundImage: 'none',
              backgroundSize: 'auto',
              backgroundRepeat: 'repeat',
              backgroundAttachment: 'scroll',
            }),
      }}
    >
      {/* Artboard background (underneath grid and nodes) */}
      {(mode === 'fixed' || mode === 'grid') && (
        <div style={{
          position: 'absolute',
          left: vOffset.x,
          top: vOffset.y,
          width: width * vZoom,
          height: height * vZoom,
          ...backgroundStyle,
          pointerEvents: 'none',
        }} />
      )}

      {/* background grid canvas */}
      <canvas ref={gridCanvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      {/* main engine mount point - Leafer canvas fills this, viewport controlled via VisualEngine.setViewport */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
        }}
        id="visual-engine-mount"
      />

      {/* Canvas border for fixed/grid mode */}
      {(mode === 'fixed' || mode === 'grid') && <div style={canvasOutlineStyle} />}

      {/* centered mask for fixed/grid mode */}
      {(mode === 'fixed' || mode === 'grid') && centeredMask && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* Top */}
          <div style={{ ...maskStyle, top: 0, left: 0, right: 0, height: Math.max(0, vOffset.y) }} />
          {/* Bottom */}
          <div style={{ ...maskStyle, bottom: 0, left: 0, right: 0, height: Math.max(0, containerDimensions.height - (vOffset.y + height * vZoom)) }} />
          {/* Left */}
          <div style={{ ...maskStyle, top: vOffset.y, left: 0, width: Math.max(0, vOffset.x), height: height * vZoom }} />
          {/* Right */}
          <div style={{ ...maskStyle, top: vOffset.y, right: 0, width: Math.max(0, containerDimensions.width - (vOffset.x + width * vZoom)), height: height * vZoom }} />
        </div>
      )}
    </div>
  );
};
