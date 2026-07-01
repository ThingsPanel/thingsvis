import { describe, expect, it } from 'vitest';
import { computeGridContentHeightPx, resolveGridCanvasMinHeight } from '../src/components/GridCanvas';

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
