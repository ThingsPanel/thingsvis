import { describe, expect, it, vi } from 'vitest';
import { nudgeSelection } from './nudgeSelection';

function createContext(mode: 'fixed' | 'infinite' | 'grid' = 'fixed') {
  return {
    selection: { nodeIds: ['node-1'] },
    nodesById: {
      'node-1': {
        id: 'node-1',
        locked: false,
        schemaRef: {
          position: { x: 10, y: 20 },
          grid: { x: 2, y: 3, w: 4, h: 5 },
        },
      },
      'node-2': {
        id: 'node-2',
        locked: false,
        schemaRef: {
          position: { x: 100, y: 200 },
          grid: { x: 5, y: 6, w: 4, h: 5 },
        },
      },
    },
    canvas: { mode },
    updateNode: vi.fn(),
    moveGridItemWithPosition: vi.fn(),
  } as any;
}

describe('nudgeSelection', () => {
  it('moves selected nodes by pixels in fixed mode', () => {
    const context = createContext('fixed');
    const didMove = nudgeSelection(context, { x: 1, y: -1 });

    expect(didMove).toBe(true);
    expect(context.updateNode).toHaveBeenCalledWith('node-1', {
      position: { x: 11, y: 19 },
    });
    expect(context.moveGridItemWithPosition).not.toHaveBeenCalled();
  });

  it('moves selected nodes by grid cells in grid mode', () => {
    const context = createContext('grid');
    const didMove = nudgeSelection(context, { x: -1, y: 1 });

    expect(didMove).toBe(true);
    expect(context.moveGridItemWithPosition).toHaveBeenCalledWith('node-1', {
      x: 1,
      y: 4,
    });
    expect(context.updateNode).not.toHaveBeenCalled();
  });

  it('moves all unlocked selected nodes and skips locked ones', () => {
    const context = createContext('fixed');
    context.selection.nodeIds = ['node-1', 'node-2', 'node-3'];
    context.nodesById['node-2'].locked = true;
    context.nodesById['node-3'] = {
      id: 'node-3',
      locked: false,
      schemaRef: {
        position: { x: 0, y: 0 },
      },
    };

    const didMove = nudgeSelection(context, { x: 0, y: 1 });

    expect(didMove).toBe(true);
    expect(context.updateNode).toHaveBeenCalledTimes(2);
    expect(context.updateNode).toHaveBeenCalledWith('node-1', {
      position: { x: 10, y: 21 },
    });
    expect(context.updateNode).toHaveBeenCalledWith('node-3', {
      position: { x: 0, y: 1 },
    });
  });

  it('returns false when nothing movable is selected', () => {
    const context = createContext('fixed');
    context.selection.nodeIds = [];

    expect(nudgeSelection(context, { x: 1, y: 0 })).toBe(false);

    context.selection.nodeIds = ['node-1'];
    context.nodesById['node-1'].locked = true;

    expect(nudgeSelection(context, { x: 1, y: 0 })).toBe(false);
    expect(context.updateNode).not.toHaveBeenCalled();
    expect(context.moveGridItemWithPosition).not.toHaveBeenCalled();
  });

  it('clamps grid movement to zero for negative coordinates', () => {
    const context = createContext('grid');

    expect(nudgeSelection(context, { x: -5, y: -10 })).toBe(true);
    expect(context.moveGridItemWithPosition).toHaveBeenCalledWith('node-1', {
      x: 0,
      y: 0,
    });
  });
});
