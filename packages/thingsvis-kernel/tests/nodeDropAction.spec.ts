import { createNodeDropActionCommand } from "../src/commands/nodeDrop";
import { getPage } from "../src/store";

describe("nodeDrop action command", () => {
  it("execute/undo should add and remove a node via action API", () => {
    const pageId = "test-page-action";
    const cmd = createNodeDropActionCommand(pageId, {
      componentType: "test.comp",
      position: { x: 5, y: 6 }
    });

    const nodeId = cmd.execute();
    const pageAfter = getPage(pageId);
    expect(pageAfter).not.toBeNull();
    expect(pageAfter.nodes.find((n) => n.id === nodeId)).toBeDefined();

    cmd.undo();
    const pageRestored = getPage(pageId);
    expect(pageRestored.nodes.find((n) => n.id === nodeId)).toBeUndefined();
  });
});


