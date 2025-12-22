import { createNodeDropCommand } from "../src/commands/nodeDrop";
import type { KernelState } from "../src/store/KernelStore";

describe("nodeDrop command", () => {
  it("execute/undo should add and remove a node", () => {
    const initialState = {
      page: { nodes: [] },
      nodesById: {},
      selection: { nodeIds: [] },
      canvas: { zoom: 1, offsetX: 0, offsetY: 0 }
    } as unknown as KernelState;

    const cmd = createNodeDropCommand({
      componentType: "test.comp",
      position: { x: 10, y: 20 }
    });

    const after = cmd.execute(initialState);
    expect(Object.keys(after.nodesById).length).toBe(1);
    const restored = cmd.undo(after);
    expect(Object.keys(restored.nodesById).length).toBe(0);
  });
});


