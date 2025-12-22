type Command = {
  id: string;
  do: () => void;
  undo: () => void;
};

export class StudioCmdStack {
  private past: Command[] = [];
  private future: Command[] = [];
  private capacity: number;

  constructor(capacity = 50) {
    this.capacity = capacity;
  }

  push(cmd: Command) {
    cmd.do();
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
    cmd.do();
    this.past.push(cmd);
  }

  clear() {
    this.past = [];
    this.future = [];
  }
}

export default StudioCmdStack;


