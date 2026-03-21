import { describe, expect, it } from 'vitest';
import type { NodeSchemaType, WidgetControls } from '@thingsvis/schema';
import {
  buildFormatBrushPatch,
  collectStylePropPaths,
  createFormatBrushSnapshot,
} from './formatBrush';

const SAMPLE_CONTROLS: WidgetControls = {
  groups: [
    {
      id: 'Content',
      label: { zh: '内容', en: 'Content' },
      fields: [{ path: 'title', label: 'Title', kind: 'string' }],
    },
    {
      id: 'Style',
      label: { zh: '样式', en: 'Style' },
      fields: [
        { path: 'primaryColor', label: 'Primary Color', kind: 'color' },
        { path: '_rotation', label: 'Rotation', kind: 'number' },
      ],
    },
    {
      id: 'Typography',
      label: { zh: '字体', en: 'Typography' },
      fields: [{ path: 'fontSize', label: 'Font Size', kind: 'slider', min: 10, max: 48 }],
    },
    {
      id: 'Data',
      label: { zh: '数据', en: 'Data' },
      fields: [{ path: 'value', label: 'Value', kind: 'number' }],
    },
  ],
};

describe('formatBrush', () => {
  it('collects only style-like prop paths', () => {
    expect(collectStylePropPaths(SAMPLE_CONTROLS)).toEqual(['primaryColor', 'fontSize']);
  });

  it('captures baseStyle and style props without content/data props', () => {
    const sourceNode: NodeSchemaType = {
      id: 'source',
      type: 'chart/line',
      position: { x: 0, y: 0 },
      props: {
        title: 'CPU',
        value: 42,
        primaryColor: '#00ffcc',
        fontSize: 28,
        _rotation: 15,
      },
      baseStyle: {
        opacity: 1,
        background: { color: '#111111', opacity: 1 },
        border: { width: 2, color: '#00ffcc', radius: 12, style: 'solid' },
      },
    };

    const snapshot = createFormatBrushSnapshot(sourceNode, SAMPLE_CONTROLS);

    expect(snapshot).toEqual({
      sourceType: 'chart/line',
      baseStyle: {
        opacity: 1,
        background: { color: '#111111', opacity: 1 },
        border: { width: 2, color: '#00ffcc', radius: 12, style: 'solid' },
      },
      styleProps: {
        primaryColor: '#00ffcc',
        fontSize: 28,
      },
    });
  });

  it('applies widget props only when source and target types match', () => {
    const snapshot = createFormatBrushSnapshot(
      {
        id: 'source',
        type: 'chart/line',
        position: { x: 0, y: 0 },
        props: {
          primaryColor: '#ffaa00',
          fontSize: 24,
        },
        baseStyle: {
          opacity: 1,
          background: { color: '#050505', opacity: 1 },
        },
      },
      SAMPLE_CONTROLS,
    );

    const sameTypePatch = buildFormatBrushPatch(snapshot, {
      id: 'target-a',
      type: 'chart/line',
      position: { x: 10, y: 10 },
      props: {
        primaryColor: '#000000',
      },
    });

    const differentTypePatch = buildFormatBrushPatch(snapshot, {
      id: 'target-b',
      type: 'basic/text',
      position: { x: 20, y: 20 },
      props: {
        fill: '#ffffff',
      },
    });

    expect(sameTypePatch).toEqual({
      baseStyle: {
        opacity: 1,
        background: { color: '#050505', opacity: 1 },
      },
      props: {
        primaryColor: '#ffaa00',
        fontSize: 24,
      },
    });
    expect(differentTypePatch).toEqual({
      baseStyle: {
        opacity: 1,
        background: { color: '#050505', opacity: 1 },
      },
    });
  });
});
