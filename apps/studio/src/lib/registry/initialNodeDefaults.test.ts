import { describe, expect, it } from 'vitest';
import { createDefaultWidgetBaseStyle, resolveInitialGridPosition } from './initialNodeDefaults';

describe('initial widget node defaults', () => {
  it('enables card mode for newly created library widgets', () => {
    expect(createDefaultWidgetBaseStyle()).toMatchObject({
      card: { enabled: true },
    });
  });

  it('derives compact grid dimensions from the widget pixel size', () => {
    const settings = { cols: 24, rowHeight: 50, gap: 10, containerWidth: 1200 };

    expect(resolveInitialGridPosition({ width: 100, height: 36 }, settings)).toMatchObject({
      x: 0,
      y: 0,
      w: 2,
      h: 1,
    });
    expect(resolveInitialGridPosition({ width: 160, height: 36 }, settings)).toMatchObject({
      w: 3,
      h: 1,
    });
  });

  it('clamps the authored x coordinate to the actual widget width', () => {
    const settings = { cols: 12, rowHeight: 50, gap: 10, containerWidth: 1200 };

    expect(
      resolveInitialGridPosition({ width: 500, height: 100 }, settings, { x: 11 }),
    ).toMatchObject({ x: 7, w: 5 });
  });
});
