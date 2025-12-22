import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { KernelStore } from '@thingsvis/kernel';
import { VisualEngine } from '../engine/VisualEngine';
import { snapPointToGrid } from '../utils/snapping';
import type { Point } from '../utils/coords';

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

export const CanvasView: React.FC<Props> = ({ store, resolvePlugin, mode = 'infinite', width = 1920, height = 1080, gridSize = 16, snapToGrid = false, centeredMask = true, onViewportChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VisualEngine>();
  const gridCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

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
    const step = gridSize * zoom;
    if (step <= 0) return;
    const rectW = rect.width;
    const rectH = rect.height;
    // compute origin for infinite pan
    const originX = offset.x % step;
    const originY = offset.y % step;
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
  }, [gridSize, zoom, offset]);

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  useEffect(() => {
    function onResize() {
      drawGrid();
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
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
      setOffset((o) => {
        const next = { x: o.x + dx, y: o.y + dy };
        return next;
      });
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
    drawGrid();
    onViewportChange?.({ width, height, zoom, offsetX: offset.x, offsetY: offset.y });
  }, [zoom, offset, drawGrid, onViewportChange, width, height]);

  // helper to convert screen -> world (used by parent if needed)
  function screenToWorld(screenPoint: Point): Point {
    if (mode === 'fixed') {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const originX = (rect.width - width * zoom) / 2;
      const originY = (rect.height - height * zoom) / 2;
      return { x: (screenPoint.x - originX) / zoom, y: (screenPoint.y - originY) / zoom };
    }
    // infinite
    return { x: (screenPoint.x - offset.x) / zoom, y: (screenPoint.y - offset.y) / zoom };
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* background grid canvas */}
      <canvas ref={gridCanvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      {/* main engine mount point */}
      <div style={{ width: '100%', height: '100%' }} id="visual-engine-mount" />
      {/* centered mask for fixed mode */}
      {mode === 'fixed' && centeredMask && (
        <>
          <div style={{ position: 'absolute', pointerEvents: 'none', inset: 0, display: 'block' }}>
            {/* compute centered area and draw four masks */}
            <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
          </div>
        </>
      )}
    </div>
  );
};


