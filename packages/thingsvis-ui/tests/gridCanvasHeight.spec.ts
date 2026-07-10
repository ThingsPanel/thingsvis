import { describe, expect, it } from 'vitest';
import {
  computeGridContentHeightPx,
  resolveGridCanvasBackgroundHeight,
  resolveGridCanvasMinHeight,
} from '../src/components/GridCanvas';

describe('computeGridContentHeightPx', () => {
  it('matches the bottom edge of occupied grid rows without trailing gap', () => {
    expect(computeGridContentHeightPx(3, { rowHeight: 50, gap: 10 }, 0)).toBe(170);
    expect(computeGridContentHeightPx(1, { rowHeight: 50, gap: 10 }, 0)).toBe(50);
  });
});

describe('resolveGridCanvasMinHeight', () => {
  it('fills the visible container in full-width preview when content is short', () => {
    expect(
      resolveGridCanvasMinHeight({
        contentHeight: 180,
        containerHeight: 984,
        fullWidth: true,
      }),
    ).toBe(984);
  });

  it('keeps full-width preview scrollable when content is taller than the container', () => {
    expect(
      resolveGridCanvasMinHeight({
        contentHeight: 1280,
        containerHeight: 984,
        fullWidth: true,
      }),
    ).toBe(1280);
  });

  it('uses content height only in content-sized embed mode', () => {
    expect(
      resolveGridCanvasMinHeight({
        contentHeight: 180,
        containerHeight: 984,
        fullWidth: true,
        contentSized: true,
      }),
    ).toBe(180);
  });

  it('preserves the existing 300px fallback outside full-width preview', () => {
    expect(
      resolveGridCanvasMinHeight({
        contentHeight: 180,
        containerHeight: 984,
        fullWidth: false,
      }),
    ).toBe(300);
  });
});

describe('grid canvas background height', () => {
  it('fills the canvas min height when content is shorter than the viewport', () => {
    const contentHeight = computeGridContentHeightPx(3, { rowHeight: 50, gap: 10 }, 0);
    const canvasMinHeight = resolveGridCanvasMinHeight({
      contentHeight,
      containerHeight: 984,
      fullWidth: true,
    });

    expect(canvasMinHeight).toBe(984);
    expect(resolveGridCanvasBackgroundHeight(contentHeight, canvasMinHeight)).toBe(984);
  });

  it('follows content height when content exceeds the canvas min height', () => {
    const contentHeight = 1280;
    const canvasMinHeight = resolveGridCanvasMinHeight({
      contentHeight,
      containerHeight: 984,
      fullWidth: true,
    });

    expect(canvasMinHeight).toBe(1280);
    expect(resolveGridCanvasBackgroundHeight(contentHeight, canvasMinHeight)).toBe(1280);
  });
});
