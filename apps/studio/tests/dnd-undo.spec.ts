import { createNodeDropActionCommand, getPage } from "@thingsvis/kernel";

describe("dnd undo flow (integration-ish)", () => {
  it("simulate drop via action command and undo", () => {
    const pageId = "test-page-e2e";
    const cmd = createNodeDropActionCommand(pageId, { componentType: "basic/text", position: { x: 10, y: 20 } });
    const nodeId = cmd.execute();
    const pageAfter = getPage(pageId);
    expect(pageAfter.nodes.find((n) => n.id === nodeId)).toBeDefined();
    cmd.undo();
    const pageRestored = getPage(pageId);
    expect(pageRestored.nodes.find((n) => n.id === nodeId)).toBeUndefined();
  });
});


