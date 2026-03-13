import { afterEach, describe, expect, it } from 'vitest';
import type { NodeSchemaType } from '@thingsvis/schema';
import {
  copyNodes,
  createDuplicatePayload,
  makePastedNodes,
  readClipboard,
  resetClipboard,
} from './clipboard';

describe('clipboard', () => {
  afterEach(() => {
    resetClipboard();
  });

  it('preserves style-related schema fields when copying and pasting', () => {
    const sourceNode: NodeSchemaType = {
      id: 'node-1',
      type: 'basic/text',
      name: 'Styled Node',
      position: { x: 100, y: 200 },
      size: { width: 240, height: 80 },
      props: {
        text: 'hello',
        nested: { align: 'center' },
        _rotation: 15,
      },
      style: {
        color: '#fff',
      },
      baseStyle: {
        background: { color: '#111', opacity: 0.5 },
        border: { width: 2, color: '#0f0', style: 'dashed', radius: 12 },
        shadow: { color: 'rgba(0,0,0,0.4)', blur: 8, offsetX: 1, offsetY: 2 },
        padding: 16,
        opacity: 0.8,
      },
      rotation: 15,
      parentId: 'group-1',
      data: [{ targetProp: 'value', expression: '$.temp' }],
      events: [{ trigger: 'click', action: 'navigate', payload: { to: '/screen-b' } }],
      grid: { x: 2, y: 3, w: 4, h: 2, static: false, isDraggable: true, isResizable: true },
      widgetVersion: '1.2.3',
    };

    copyNodes([sourceNode]);
    const clipboard = readClipboard();

    expect(clipboard?.nodes).toHaveLength(1);

    const pastedNodes = makePastedNodes(clipboard!, { dx: 20, dy: 20, n: 1 });

    expect(pastedNodes).toHaveLength(1);

    const pastedNode = pastedNodes[0]!;

    expect(pastedNode.id).not.toBe(sourceNode.id);
    expect(pastedNode.name).toBe(sourceNode.name);
    expect(pastedNode.position).toEqual({ x: 120, y: 220 });
    expect(pastedNode.size).toEqual(sourceNode.size);
    expect(pastedNode.props).toEqual(sourceNode.props);
    expect(pastedNode.style).toEqual(sourceNode.style);
    expect(pastedNode.baseStyle).toEqual(sourceNode.baseStyle);
    expect(pastedNode.rotation).toBe(sourceNode.rotation);
    expect(pastedNode.parentId).toBe(sourceNode.parentId);
    expect(pastedNode.data).toEqual(sourceNode.data);
    expect(pastedNode.events).toEqual(sourceNode.events);
    expect(pastedNode.grid).toEqual({
      x: 3,
      y: 4,
      w: 4,
      h: 2,
      static: false,
      isDraggable: true,
      isResizable: true,
    });
    expect(pastedNode.widgetVersion).toBe(sourceNode.widgetVersion);
  });

  it('isolates clipboard snapshots from later source mutations', () => {
    const sourceNode: NodeSchemaType = {
      id: 'node-2',
      type: 'basic/text',
      position: { x: 10, y: 20 },
      props: {
        nested: { label: 'before' },
      },
      baseStyle: {
        background: { color: '#123456', opacity: 1 },
        opacity: 1,
      },
      data: [{ targetProp: 'value', expression: '$.humidity' }],
    };

    copyNodes([sourceNode]);
    (sourceNode.props as { nested: { label: string } }).nested.label = 'after';
    (sourceNode.baseStyle as NonNullable<NodeSchemaType['baseStyle']>).background!.color =
      '#654321';
    (sourceNode.data as NonNullable<NodeSchemaType['data']>)[0]!.expression = '$.changed';

    const clipboard = readClipboard();
    const snapshot = clipboard?.nodes[0];

    expect(snapshot?.props).toEqual({ nested: { label: 'before' } });
    expect(snapshot?.baseStyle).toEqual({
      background: { color: '#123456', opacity: 1 },
      opacity: 1,
    });
    expect(snapshot?.data).toEqual([{ targetProp: 'value', expression: '$.humidity' }]);
  });

  it('creates duplicate payloads without sharing nested references', () => {
    const sourceNode: NodeSchemaType = {
      id: 'node-3',
      type: 'basic/text',
      position: { x: 0, y: 0 },
      props: {
        nested: { enabled: true },
      },
    };

    const payload = createDuplicatePayload([sourceNode]);
    const duplicatedNodes = makePastedNodes(payload!, { dx: 20, dy: 20, n: 1 });

    expect(duplicatedNodes).toHaveLength(1);

    const duplicatedNode = duplicatedNodes[0]!;

    (duplicatedNode.props as { nested: { enabled: boolean } }).nested.enabled = false;

    expect(sourceNode.props).toEqual({ nested: { enabled: true } });
  });
});
