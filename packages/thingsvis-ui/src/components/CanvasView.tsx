import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSyncExternalStore } from 'react';
import type { KernelStore, KernelState } from '@thingsvis/kernel';
import { VisualEngine } from '../engine/VisualEngine';
import { snapPointToGrid } from '../utils/snapping';
import type { Point } from '../utils/coords';
import { calculateScaleToFit } from '../modes/mode-controller';

type Mode = 'fixed' | 'infinite' | 'reflow';

type Props = {
  store: KernelStore;
  resolvePlugin?: (type: string) => Promise<any>;
  mode?: Mode;
  width?: number;
  height?: number;
  gridSize?: number;
  snapToGrid?: boolean;
  centeredMask?: boolean;
  onViewportChange?: (vp: { width: number; height: number; zoom: number; offsetX: number; offsetY: number }) => void;
};

export const CanvasView: React.FC<Props> = ({ 
  store, 
  resolvePlugin, 
  mode: propsMode, 
  width: propsWidth, 
  height: propsHeight, 
  gridSize = 16, 
  snapToGrid = false, 
  centeredMask = true, 
  onViewportChange 
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

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
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

  const viewportInfo = useMemo(() => {
    let currentZoom = zoom;
    let currentOffset = offset;

    if (mode === 'fixed' && containerDimensions.width > 0) {
      currentZoom = calculateScaleToFit(containerDimensions.width, containerDimensions.height, width, height, 40);
      currentOffset = {
        x: (containerDimensions.width - width * currentZoom) / 2,
        y: (containerDimensions.height - height * currentZoom) / 2
      };
    }

    return { zoom: currentZoom, offset: currentOffset };
  }, [mode, width, height, zoom, offset, containerDimensions]);

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
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    
    const { zoom: vZoom, offset: vOffset } = viewportInfo;
    const step = gridSize * vZoom;
    if (step <= 0) return;
    const rectW = rect.width;
    const rectH = rect.height;
    // compute origin for infinite pan
    const originX = vOffset.x % step;
    const originY = vOffset.y % step;
    for (let x = originX; x < rectW; x += step) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, rectH);
      ctx.stroke();
    }
    for (let y = originY; y < rectH; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(rectW, y + 0.5);
      ctx.stroke();
    }
  }, [gridSize, viewportInfo]);

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
    const engine = new VisualEngine(store, { resolvePlugin });
    engineRef.current = engine;
    engine.mount(mountEl ?? containerRef.current);
    return () => {
      engine.unmount();
    };
  }, [store, resolvePlugin]);

  // pan handling (infinite mode)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let isPanning = false;
    let lastX = 0;
    let lastY = 0;

    function onPointerDown(e: PointerEvent) {
      if (mode !== 'infinite') return;
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
    }
    function onPointerUp(e: PointerEvent) {
      isPanning = false;
      try { (e.target as Element).releasePointerCapture?.(e.pointerId); } catch {}
    }

    function onWheel(e: WheelEvent) {
      if (mode !== 'infinite') return;
      const delta = -e.deltaY;
      const factor = delta > 0 ? 1.05 : 0.95;
      setZoom((z) => Math.max(0.1, Math.min(10, z * factor)));
    }

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('wheel', onWheel as any);
    };
  }, [mode]);

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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    pointerEvents: 'none',
    zIndex: 10
  };

  const { zoom: vZoom, offset: vOffset } = viewportInfo;

  // Fixed mode border/shadow
  const canvasOutlineStyle: React.CSSProperties = mode === 'fixed' ? {
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
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* background grid canvas */}
      <canvas ref={gridCanvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      
      {/* main engine mount point */}
      <div 
        style={{ 
          width: '100%', 
          height: '100%',
          transform: `translate(${vOffset.x}px, ${vOffset.y}px) scale(${vZoom})`,
          transformOrigin: '0 0'
        }} 
        id="visual-engine-mount" 
      />

      {/* Canvas border for fixed mode */}
      {mode === 'fixed' && <div style={canvasOutlineStyle} />}

      {/* centered mask for fixed mode */}
      {mode === 'fixed' && centeredMask && (
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
