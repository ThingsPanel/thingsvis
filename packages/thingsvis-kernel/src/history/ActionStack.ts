import type { KernelState } from '../store/KernelStore';

type ActionCommand = {
  id: string;
  type?: string;
  execute: () => void;
  undo: () => void;
};

export class ActionStack {
  private past: ActionCommand[] = [];
  private future: ActionCommand[] = [];
  private capacity: number;

  constructor(capacity = 50) {
    this.capacity = capacity;
  }

  push(cmd: ActionCommand) {
    cmd.execute();
    this.past.push(cmd);
    if (this.past.length > this.capacity) {
      this.past.splice(0, this.past.length - this.capacity);
    }
    this.future = [];
  }

  undo() {
    const cmd = this.past.pop();
    if (!cmd) return;
    cmd.undo();
    this.future.push(cmd);
  }

  redo() {
    const cmd = this.future.pop();
    if (!cmd) return;
    cmd.execute();
    this.past.push(cmd);
  }

  clear() {
    this.past = [];
    this.future = [];
  }

  getPastCount() {
    return this.past.length;
  }
}

export const actionStack = new ActionStack(50);

export default ActionStack;
