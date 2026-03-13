import { describe, expect, it } from 'vitest';
import type { KernelState } from '../src/store/KernelStore';
import { HistoryManager } from '../src/history/HistoryManager';
import { createMoveCommand } from '../src/commands/moveCommand';

function createState(): KernelState {
  return {
    page: { nodes: [] } as KernelState['page'],
    nodesById: {
      node1: {
        id: 'node1',
        schemaRef: {
          id: 'node1',
          type: 'basic/rect',
          position: { x: 0, y: 0 },
        },
        visible: true,
        locked: false,
      },
    },
    connections: [],
    selection: { nodeIds: [] },
    canvas: { mode: 'infinite', width: 1920, height: 1080, zoom: 1, offsetX: 0, offsetY: 0 },
    dataSources: {},
    layerOrder: ['node1'],
    layerGroups: {},
    gridState: {
      settings: null,
      activeBreakpoint: null,
      colWidth: 0,
      containerWidth: 0,
      effectiveCols: 0,
      preview: { active: false, itemId: null, targetPosition: null, affectedItems: [] },
      totalHeight: 0,
    },
    variableDefinitions: [],
    variableValues: {},
  };
}

describe('command undo/redo', () => {
  it('moves a node through execute, undo, and redo', () => {
    const historyManager = new HistoryManager(10);
    const initialState = createState();

    const command = createMoveCommand('node1', { x: 0, y: 0 }, { x: 10, y: 20 });
    const stateAfterExecute = historyManager.push(command, initialState);
    expect(stateAfterExecute.nodesById.node1?.schemaRef.position).toEqual({ x: 10, y: 20 });

    const stateAfterUndo = historyManager.undo(stateAfterExecute);
    expect(stateAfterUndo.nodesById.node1?.schemaRef.position).toEqual({ x: 0, y: 0 });

    const stateAfterRedo = historyManager.redo(stateAfterUndo);
    expect(stateAfterRedo.nodesById.node1?.schemaRef.position).toEqual({ x: 10, y: 20 });
  });

  it('clears redo history when a new command is pushed after undo', () => {
    const historyManager = new HistoryManager(10);
    const initialState = createState();

    const firstMove = createMoveCommand('node1', { x: 0, y: 0 }, { x: 10, y: 20 });
    const secondMove = createMoveCommand('node1', { x: 0, y: 0 }, { x: 30, y: 40 });

    const stateAfterFirstMove = historyManager.push(firstMove, initialState);
    const stateAfterUndo = historyManager.undo(stateAfterFirstMove);

    expect(historyManager.getFutureCount()).toBe(1);

    const stateAfterSecondMove = historyManager.push(secondMove, stateAfterUndo);

    expect(stateAfterSecondMove.nodesById.node1?.schemaRef.position).toEqual({ x: 30, y: 40 });
    expect(historyManager.getFutureCount()).toBe(0);
    expect(historyManager.getPastCount()).toBe(1);
  });
});


