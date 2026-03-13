import { HistoryManager } from "../src/history/HistoryManager";

describe("HistoryManager capacity", () => {
  it("keeps only the configured number of past commands", () => {
    const hm = new HistoryManager(5);
    const dummyState = { page: { nodes: [] }, nodesById: {}, selection: { nodeIds: [] } } as any;

    const makeCmd = (id: string) => ({
      id,
      type: "noop",
      execute: (s: any) => s,
      undo: (s: any) => s,
    });

    let state = dummyState;
    for (let i = 0; i < 10; i++) {
      state = hm.push(makeCmd(`c${i}`), state);
    }

    expect(hm.getPastCount()).toBe(5);
  });
});


