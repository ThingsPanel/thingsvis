import { describe, expect, it } from 'vitest';
import { resolveGridCanvasMinHeight } from '../src/components/GridCanvas';

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
