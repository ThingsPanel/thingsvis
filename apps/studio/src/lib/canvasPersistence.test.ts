import { describe, expect, it } from 'vitest';
import type { CanvasState } from '@thingsvis/kernel';
import { getCanvasPersistenceSignature, hasPersistedEditorStateChange } from './canvasPersistence';

function createCanvas(overrides: Partial<CanvasState> = {}): CanvasState {
  return {
    mode: 'fixed',
    width: 1920,
    height: 1080,
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    gridEnabled: false,
    gridSize: 20,
    ...overrides,
  };
}

describe('getCanvasPersistenceSignature', () => {
  it('ignores viewport-only fields', () => {
    const base = getCanvasPersistenceSignature(createCanvas());
    const viewportOnly = getCanvasPersistenceSignature(
      createCanvas({
        zoom: 2,
        offsetX: 120,
        offsetY: 240,
      }),
    );

    expect(viewportOnly).toBe(base);
  });

  it('tracks persisted canvas fields', () => {
    const base = getCanvasPersistenceSignature(createCanvas());
    const resized = getCanvasPersistenceSignature(createCanvas({ width: 1600 }));
    const gridded = getCanvasPersistenceSignature(createCanvas({ gridEnabled: true }));

    expect(resized).not.toBe(base);
    expect(gridded).not.toBe(base);
  });

  it('only marks the editor dirty for persisted state changes', () => {
    const baseState = {
      nodesById: { nodeA: { id: 'nodeA' } },
      layerOrder: ['nodeA'],
      variableDefinitions: [{ name: 'speed', defaultValue: 1 }],
      canvas: createCanvas(),
    } as any;

    expect(
      hasPersistedEditorStateChange(baseState, {
        ...baseState,
        canvas: createCanvas({ zoom: 2, offsetX: 200, offsetY: 100 }),
      }),
    ).toBe(false);

    expect(
      hasPersistedEditorStateChange(baseState, {
        ...baseState,
        canvas: createCanvas({ width: 1600 }),
      }),
    ).toBe(true);

    expect(
      hasPersistedEditorStateChange(baseState, {
        ...baseState,
        nodesById: { nodeA: { id: 'nodeA' }, nodeB: { id: 'nodeB' } },
      }),
    ).toBe(true);
  });
});
