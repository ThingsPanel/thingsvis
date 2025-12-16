import type { KernelState } from '../store/KernelStore';

export type Command = {
  id: string;
  type: string;
  payload?: unknown;
  execute: (state: KernelState) => KernelState;
  undo: (state: KernelState) => KernelState;
};

export class HistoryManager {
  private past: Command[] = [];
  private future: Command[] = [];

  push(command: Command, state: KernelState): KernelState {
    const next = command.execute(structuredClone(state));
    this.past.push(command);
    this.future = [];
    return next;
  }

  undo(state: KernelState): KernelState {
    const command = this.past.pop();
    if (!command) return state;
    const next = command.undo(structuredClone(state));
    this.future.push(command);
    return next;
  }

  redo(state: KernelState): KernelState {
    const command = this.future.pop();
    if (!command) return state;
    const next = command.execute(structuredClone(state));
    this.past.push(command);
    return next;
  }
}


