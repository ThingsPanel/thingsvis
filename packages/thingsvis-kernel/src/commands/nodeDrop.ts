import type { KernelState } from "../store/KernelStore";
import { generateId } from "../utils/id";
import { action, getPage } from "../store";

/**
 * NodeDropCommand
 *
 * Implements the Command interface expected by HistoryManager.
 * On execute: inserts a node schema into state.page.nodes and nodesById
 * On undo: removes the node and restores previous selection.
 */
export const createNodeDropCommand = (payload: {
  nodeId?: string;
  componentType: string;
  initialProps?: Record<string, unknown>;
  position: { x: number; y: number };
  meta?: { source?: string };
}) => {
  const id = generateId("node");
  const nodeId = payload.nodeId ?? `${id}`;

  const command = {
    id,
    type: "node.drop",
    payload,
    execute(state: KernelState): KernelState {
      const next = structuredClone(state);
      const page = next.page;
      if (!page) return next;
      const nodeSchema = {
        id: nodeId,
        type: payload.componentType,
        position: payload.position,
        props: payload.initialProps ?? {}
      };
      // append to page nodes
      (page.nodes as any[]).push(nodeSchema);
      // update nodesById
      next.nodesById[nodeId] = {
        id: nodeId,
        schemaRef: nodeSchema as any,
        visible: true
      } as any;
      // set selection
      next.selection = { nodeIds: [nodeId] };
      return next;
    },
    undo(state: KernelState): KernelState {
      const next = structuredClone(state);
      const page = next.page;
      if (!page) return next;
      // remove from page.nodes
      page.nodes = (page.nodes as any[]).filter((n: any) => n.id !== nodeId) as any;
      // remove from nodesById
      delete next.nodesById[nodeId];
      // clear selection or restore previous (best-effort: clear)
      next.selection = { nodeIds: [] };
      return next;
    }
  };

  return command;
};

export default createNodeDropCommand;

/**
 * Action-backed node drop command (works with in-memory kernel.action API)
 * Useful for apps that use the kernel action API instead of KernelState.
 */
export const createNodeDropActionCommand = (pageId: string, payload: {
  nodeId?: string;
  componentType: string;
  initialProps?: Record<string, unknown>;
  position: { x: number; y: number };
  meta?: { source?: string };
}) => {
  const id = generateId("node");
  const nodeId = payload.nodeId ?? `${id}`;

  return {
    id,
    type: "node.drop.action",
    payload,
    execute() {
      const node = {
        id: nodeId,
        type: payload.componentType,
        position: payload.position,
        props: payload.initialProps ?? {}
      };
      action.addNode(pageId, node);
      return nodeId;
    },
    undo() {
      action.removeNode(pageId, nodeId);
      return nodeId;
    }
  };
};


