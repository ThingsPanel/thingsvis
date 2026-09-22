import { describe, expect, it } from 'vitest';
import {
  createDefaultWidgetBaseStyle,
  resolveInitialGridPosition,
  resolveWidgetSurfaceOwner,
} from './initialNodeDefaults';

describe('initial widget node defaults', () => {
  it('enables the theme card only for host-surface data and chart widgets', () => {
    expect(createDefaultWidgetBaseStyle('interaction/value-card')).toMatchObject({
      card: { enabled: true, appearance: 'auto' },
    });
    expect(createDefaultWidgetBaseStyle('chart/echarts-line')).toMatchObject({
      card: { enabled: true, appearance: 'auto' },
    });
  });

  it('does not wrap self-surface controls or unrelated widgets in a second card', () => {
    expect(createDefaultWidgetBaseStyle('interaction/basic-switch')).toMatchObject({
      card: { enabled: false, appearance: 'auto' },
    });
    expect(createDefaultWidgetBaseStyle('basic/text')).toMatchObject({
      card: { enabled: false, appearance: 'auto' },
    });
  });

  it('declares one surface owner for every initial widget category', () => {
    expect(resolveWidgetSurfaceOwner('interaction/value-card')).toBe('host');
    expect(resolveWidgetSurfaceOwner('chart/realtime-history-curve')).toBe('host');
    expect(resolveWidgetSurfaceOwner('interaction/basic-button')).toBe('self');
    expect(resolveWidgetSurfaceOwner('media/image')).toBe('none');
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
