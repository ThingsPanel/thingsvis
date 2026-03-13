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
  private capacity: number;

  constructor(capacity = 50) {
    this.capacity = capacity;
  }

  push(command: Command, state: KernelState): KernelState {
    const next = command.execute(structuredClone(state));
    this.past.push(command);
    // enforce capacity
    if (this.past.length > this.capacity) {
      this.past.splice(0, this.past.length - this.capacity);
    }
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

  getPastCount() {
    return this.past.length;
  }

  getFutureCount() {
    return this.future.length;
  }

  clear() {
    this.past = [];
    this.future = [];
  }
}


