import React, { useEffect, useState, useMemo, useRef } from 'react';
import type { PreviewAlignY, PreviewScaleMode } from '../pages/PreviewPage';

interface ScaleScreenProps {
  /** Natural width of the design canvas (e.g. 1920) */
  width: number;
  /** Natural height of the design canvas (e.g. 1080) */
  height: number;
  /** Scaling strategy */
  mode: PreviewScaleMode;
  /** Vertical alignment applied after preview scaling */
  alignY?: PreviewAlignY;
  /**
   * Render prop. Receives `engineZoom`:
   * - For centering modes (fit-min, stretch): always 1. CSS transform handles visual scale.
   * - For scroll modes (fit-width, fit-height, original): the actual scale ratio.
   *   Pass this as `zoom` to PreviewCanvas so VisualEngine renders at the correct density.
   */
  children: (engineZoom: number) => React.ReactNode;
}

/**
 * ScaleScreen — orchestrates all 5 preview scaling strategies.
 *
 * Strategy split:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  Centering modes (fit-min, stretch)                                      │
 * │  • Outer: position:absolute inset-0, flex center, overflow:hidden        │
 * │  • Inner: fixed canvasW × canvasH, CSS transform:scale, origin:center    │
 * │  • engineZoom = 1 (VisualEngine renders at 1:1, CSS handles the rest)    │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  Scroll modes (fit-width, fit-height, original)                          │
 * │  • Outer: position:absolute inset-0, block, overflow per-axis            │
 * │  • Inner: sized to canvasW×scale × canvasH×scale (layout = visual size) │
 * │  • engineZoom = scale (VisualEngine renders at density, scrollbar exact) │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
export const ScaleScreen: React.FC<ScaleScreenProps> = ({
  width,
  height,
  mode,
  alignY = 'center',
  children,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({
    width: typeof document !== 'undefined' ? document.documentElement.clientWidth : 1920,
    height: typeof document !== 'undefined' ? document.documentElement.clientHeight : 1080,
  });

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setViewportSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(() => {
    // Guard against invalid canvas dimensions
    if (!width || !height) {
      return {
        wrapperStyle: { position: 'absolute', inset: 0 } as React.CSSProperties,
        innerStyle: { width, height } as React.CSSProperties,
        engineZoom: 1,
        useCssTransform: false,
      };
    }

    const { width: vw, height: vh } = viewportSize;
    const ratioW = vw / width;
    const ratioH = vh / height;

    // ── CENTERING MODES ────────────────────────────────────────────────────
    if (mode === 'fit-min' || mode === 'stretch') {
      const sx = mode === 'fit-min' ? Math.min(ratioW, ratioH) : ratioW;
      const sy = mode === 'fit-min' ? Math.min(ratioW, ratioH) : ratioH;

      return {
        wrapperStyle: {
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: alignY === 'top' ? 'flex-start' : 'center',
          overflow: 'hidden',
        } as React.CSSProperties,
        innerStyle: {
          width,
          height,
          transform: `scale(${sx}, ${sy})`,
          transformOrigin: alignY === 'top' ? 'top center' : 'center center',
          // Prevent flex from squashing the inner div before transform applies
          flexShrink: 0,
          transition: 'transform 0.2s ease-out',
        } as React.CSSProperties,
        engineZoom: 1,
        useCssTransform: true,
      };
    }

    // ── SCROLL MODES ───────────────────────────────────────────────────────
    // Inner div is sized to the VISUAL output size, so scrollbars are accurate.
    // VisualEngine receives `scale` as its zoom, rendering widgets at the correct density.
    let scale = 1;
    let overflowX: React.CSSProperties['overflowX'] = 'auto';
    let overflowY: React.CSSProperties['overflowY'] = 'auto';

    if (mode === 'fit-width') {
      scale = ratioW;
      overflowX = 'hidden'; // Horizontally, nothing should overflow
      overflowY = scale < 1 ? 'hidden' : 'auto'; // Scroll vertically only if canvas is taller than viewport
    } else if (mode === 'fit-height') {
      scale = ratioH;
      overflowX = scale < 1 ? 'hidden' : 'auto'; // Scroll horizontally only if canvas is wider than viewport
      overflowY = 'hidden'; // Vertically, nothing should overflow
    }
    // 'original': scale = 1, both axes auto

    const scaledW = Math.round(width * scale);
    const scaledH = Math.round(height * scale);

    return {
      wrapperStyle: {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: scaledW <= vw ? 'center' : 'flex-start',
        justifyContent: alignY === 'top' ? 'flex-start' : scaledH <= vh ? 'center' : 'flex-start',
        overflowX,
        overflowY,
      } as React.CSSProperties,
      innerStyle: {
        width: scaledW,
        height: scaledH,
        flexShrink: 0,
        // No CSS transform — layout IS the visual size
      } as React.CSSProperties,
      engineZoom: scale,
      useCssTransform: false,
    };
  }, [alignY, width, height, mode, viewportSize]);

  return (
    <div ref={wrapperRef} style={layout.wrapperStyle}>
      <div style={layout.innerStyle}>{children(layout.engineZoom)}</div>
    </div>
  );
};
