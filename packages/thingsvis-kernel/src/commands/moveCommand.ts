import type { KernelState } from "../store/KernelStore";
import { generateId } from "../utils/id";

export const createMoveCommand = (nodeId: string, from: { x: number; y: number }, to: { x: number; y: number }) => {
  const id = generateId("move");
  const command = {
    id,
    type: "node.move",
    payload: { nodeId, from, to },
    execute(state: KernelState): KernelState {
      const next = structuredClone(state);
      const node = next.nodesById[nodeId];
      if (!node) return next;
      const prevPos = (node.schemaRef as any).position ?? { x: 0, y: 0 };
      (node.schemaRef as any).position = { ...prevPos, x: to.x, y: to.y };
      return next;
    },
    undo(state: KernelState): KernelState {
      const next = structuredClone(state);
      const node = next.nodesById[nodeId];
      if (!node) return next;
      (node.schemaRef as any).position = { ...((node.schemaRef as any).position ?? {}), x: from.x, y: from.y };
      return next;
    }
  };
  return command;
};

export default createMoveCommand;


