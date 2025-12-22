import { HistoryManager } from "../src/history/HistoryManager";
import { createMoveCommand } from "../src/commands/moveCommand";

describe("command undo/redo", () => {
  it("move command undo/redo behaves correctly", () => {
    const hm = new HistoryManager(10);
    const dummyState = {
      page: { nodes: [] },
      nodesById: {
        node1: { id: "node1", schemaRef: { id: "node1", position: { x: 0, y: 0 } }, visible: true }
      },
      selection: { nodeIds: [] },
      canvas: { zoom: 1, offsetX: 0, offsetY: 0 }
    } as any;

    const cmd = createMoveCommand("node1", { x: 0, y: 0 }, { x: 10, y: 20 });
    const after = hm.push(cmd as any, dummyState);
    expect((after.nodesById["node1"].schemaRef as any).position.x).toBe(10);
    const undone = hm.undo(after);
    expect((undone.nodesById["node1"].schemaRef as any).position.x).toBe(0);
    const redone = hm.redo(undone);
    expect((redone.nodesById["node1"].schemaRef as any).position.x).toBe(10);
  });
});


