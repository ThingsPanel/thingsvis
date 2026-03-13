import { HistoryManager, Command } from "./HistoryManager";
import type { KernelState } from "../store/KernelStore";

export class CmdStack {
  private manager: HistoryManager;

  constructor(capacity = 50) {
    this.manager = new HistoryManager(capacity);
  }

  push(cmd: Command, state: KernelState): KernelState {
    return this.manager.push(cmd, state);
  }

  undo(state: KernelState): KernelState {
    return this.manager.undo(state);
  }

  redo(state: KernelState): KernelState {
    return this.manager.redo(state);
  }

  getPastCount() {
    return this.manager.getPastCount();
  }

  getFutureCount() {
    return this.manager.getFutureCount();
  }
}

export default CmdStack;


