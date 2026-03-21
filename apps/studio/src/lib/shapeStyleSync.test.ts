import { describe, expect, it } from 'vitest';
import { syncShapeStylePatch } from './shapeStyleSync';

describe('syncShapeStylePatch', () => {
  it('keeps incoming props while normalizing rectangle baseStyle updates', () => {
    const patch = syncShapeStylePatch(
      'basic/rectangle',
      {
        baseStyle: {
          border: { radius: 14, width: 3, color: '#ff6600' },
        } as any,
        props: {
          fill: '#dbeafe',
          opacity: 0.8,
        },
      },
      {
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 2,
        cornerRadius: 6,
      },
    );

    expect(patch).toEqual({
      baseStyle: {
        border: { radius: 14, width: 3, color: '#ff6600' },
      },
      props: {
        fill: '#dbeafe',
        opacity: 0.8,
        stroke: 'transparent',
        strokeWidth: 0,
        cornerRadius: 14,
      },
    });
  });

  it('normalizes circle baseStyle updates without dropping current fill props', () => {
    const patch = syncShapeStylePatch(
      'basic/circle',
      {
        baseStyle: {
          border: { width: 4, color: '#22c55e' },
        } as any,
      },
      {
        fill: '#f0f9ff',
        stroke: '#0f172a',
        strokeWidth: 2,
      },
    );

    expect(patch).toEqual({
      baseStyle: {
        border: { width: 4, color: '#22c55e' },
      },
      props: {
        fill: '#f0f9ff',
        stroke: 'transparent',
        strokeWidth: 0,
      },
    });
  });
});
