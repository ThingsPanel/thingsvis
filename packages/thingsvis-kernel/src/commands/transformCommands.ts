import type { KernelState } from '../store/KernelStore';
import { generateId } from '../utils/id';

export const createResizeCommand = (
  nodeId: string,
  from: { width: number; height: number },
  to: { width: number; height: number },
) => {
  const id = generateId('resize');
  return {
    id,
    type: 'node.resize',
    payload: { nodeId, from, to },
    execute(state: KernelState): KernelState {
      const next = structuredClone(state);
      const node = next.nodesById[nodeId];
      if (!node) return next;
      const prevBox = node.schemaRef.size ?? { width: 0, height: 0 };
      node.schemaRef.size = { ...prevBox, width: to.width, height: to.height };
      return next;
    },
    undo(state: KernelState): KernelState {
      const next = structuredClone(state);
      const node = next.nodesById[nodeId];
      if (!node) return next;
      node.schemaRef.size = {
        ...(node.schemaRef.size ?? { width: 0, height: 0 }),
        width: from.width,
        height: from.height,
      };
      return next;
    },
  };
};

export const createRotateCommand = (nodeId: string, from: number, to: number) => {
  const id = generateId('rotate');
  return {
    id,
    type: 'node.rotate',
    payload: { nodeId, from, to },
    execute(state: KernelState): KernelState {
      const next = structuredClone(state);
      const node = next.nodesById[nodeId];
      if (!node) return next;
      node.schemaRef.rotation = to;
      return next;
    },
    undo(state: KernelState): KernelState {
      const next = structuredClone(state);
      const node = next.nodesById[nodeId];
      if (!node) return next;
      node.schemaRef.rotation = from;
      return next;
    },
  };
};

export default {
  createResizeCommand,
  createRotateCommand,
};
