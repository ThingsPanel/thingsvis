import { describe, expect, it, vi } from 'vitest';
import { createDefaultCommands } from './defaultCommands';
import { COMMAND_IDS, DEFAULT_SHORTCUTS } from './constants';

function createKernelState(selectedIds: string[] = []) {
  return {
    selection: { nodeIds: selectedIds },
    nodesById: Object.fromEntries(selectedIds.map((id) => [id, { id }])),
  } as any;
}

describe('createDefaultCommands', () => {
  it('registers layer reorder commands with the expected shortcuts', () => {
    const commands = createDefaultCommands({
      saveProject: async () => undefined,
      getKernelState: () => createKernelState(['node-1']),
      bringSelectionForward: vi.fn(),
      sendSelectionBackward: vi.fn(),
    });

    const bringForward = commands.find((command) => command.id === COMMAND_IDS.EDIT_BRING_FORWARD);
    const sendBackward = commands.find((command) => command.id === COMMAND_IDS.EDIT_SEND_BACKWARD);

    expect(bringForward?.shortcut).toEqual(DEFAULT_SHORTCUTS[COMMAND_IDS.EDIT_BRING_FORWARD]);
    expect(sendBackward?.shortcut).toEqual(DEFAULT_SHORTCUTS[COMMAND_IDS.EDIT_SEND_BACKWARD]);
    expect(bringForward?.when?.()).toBe(true);
    expect(sendBackward?.when?.()).toBe(true);
  });

  it('executes layer reorder commands against the current selection', async () => {
    const bringSelectionForward = vi.fn();
    const sendSelectionBackward = vi.fn();

    const commands = createDefaultCommands({
      saveProject: async () => undefined,
      getKernelState: () => createKernelState(['node-1']),
      bringSelectionForward,
      sendSelectionBackward,
    });

    await commands.find((command) => command.id === COMMAND_IDS.EDIT_BRING_FORWARD)?.execute();
    await commands.find((command) => command.id === COMMAND_IDS.EDIT_SEND_BACKWARD)?.execute();

    expect(bringSelectionForward).toHaveBeenCalledTimes(1);
    expect(sendSelectionBackward).toHaveBeenCalledTimes(1);
  });

  it('disables layer reorder commands when nothing is selected', () => {
    const commands = createDefaultCommands({
      saveProject: async () => undefined,
      getKernelState: () => createKernelState([]),
      bringSelectionForward: vi.fn(),
      sendSelectionBackward: vi.fn(),
    });

    const bringForward = commands.find((command) => command.id === COMMAND_IDS.EDIT_BRING_FORWARD);
    const sendBackward = commands.find((command) => command.id === COMMAND_IDS.EDIT_SEND_BACKWARD);

    expect(bringForward?.when?.()).toBe(false);
    expect(sendBackward?.when?.()).toBe(false);
  });

  it('registers nudge commands with arrow key shortcuts', () => {
    const commands = createDefaultCommands({
      saveProject: async () => undefined,
      getKernelState: () => createKernelState(['node-1']),
      nudgeSelectionBy: vi.fn(),
    });

    expect(
      commands.find((command) => command.id === COMMAND_IDS.EDIT_NUDGE_LEFT)?.shortcut,
    ).toEqual(DEFAULT_SHORTCUTS[COMMAND_IDS.EDIT_NUDGE_LEFT]);
    expect(
      commands.find((command) => command.id === COMMAND_IDS.EDIT_NUDGE_RIGHT)?.shortcut,
    ).toEqual(DEFAULT_SHORTCUTS[COMMAND_IDS.EDIT_NUDGE_RIGHT]);
    expect(commands.find((command) => command.id === COMMAND_IDS.EDIT_NUDGE_UP)?.shortcut).toEqual(
      DEFAULT_SHORTCUTS[COMMAND_IDS.EDIT_NUDGE_UP],
    );
    expect(
      commands.find((command) => command.id === COMMAND_IDS.EDIT_NUDGE_DOWN)?.shortcut,
    ).toEqual(DEFAULT_SHORTCUTS[COMMAND_IDS.EDIT_NUDGE_DOWN]);
  });

  it('executes nudge commands with the expected delta', async () => {
    const nudgeSelectionBy = vi.fn();
    const commands = createDefaultCommands({
      saveProject: async () => undefined,
      getKernelState: () => createKernelState(['node-1']),
      nudgeSelectionBy,
    });

    await commands.find((command) => command.id === COMMAND_IDS.EDIT_NUDGE_LEFT)?.execute();
    await commands.find((command) => command.id === COMMAND_IDS.EDIT_NUDGE_RIGHT)?.execute();
    await commands.find((command) => command.id === COMMAND_IDS.EDIT_NUDGE_UP)?.execute();
    await commands.find((command) => command.id === COMMAND_IDS.EDIT_NUDGE_DOWN)?.execute();

    expect(nudgeSelectionBy).toHaveBeenNthCalledWith(1, { x: -1, y: 0 });
    expect(nudgeSelectionBy).toHaveBeenNthCalledWith(2, { x: 1, y: 0 });
    expect(nudgeSelectionBy).toHaveBeenNthCalledWith(3, { x: 0, y: -1 });
    expect(nudgeSelectionBy).toHaveBeenNthCalledWith(4, { x: 0, y: 1 });
  });

  it('disables nudge commands when no unlocked nodes are selected', () => {
    const commands = createDefaultCommands({
      saveProject: async () => undefined,
      getKernelState: () =>
        ({
          selection: { nodeIds: ['node-1'] },
          nodesById: {
            'node-1': { id: 'node-1', locked: true },
          },
        }) as any,
      nudgeSelectionBy: vi.fn(),
    });

    expect(commands.find((command) => command.id === COMMAND_IDS.EDIT_NUDGE_LEFT)?.when?.()).toBe(
      false,
    );
    expect(commands.find((command) => command.id === COMMAND_IDS.EDIT_NUDGE_RIGHT)?.when?.()).toBe(
      false,
    );
    expect(commands.find((command) => command.id === COMMAND_IDS.EDIT_NUDGE_UP)?.when?.()).toBe(
      false,
    );
    expect(commands.find((command) => command.id === COMMAND_IDS.EDIT_NUDGE_DOWN)?.when?.()).toBe(
      false,
    );
  });
});
