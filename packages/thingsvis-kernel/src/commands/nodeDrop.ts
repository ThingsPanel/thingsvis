import type { KernelState, NodeState } from '../store/types';
import type { NodeSchemaType } from '@thingsvis/schema';
import { generateId } from '../utils/id';
import { action } from '../store';

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
  const id = generateId('node');
  const nodeId = payload.nodeId ?? `${id}`;

  /**
   * Locate the nodes array from either page format:
   * - PageSchemaType: { nodes: [...] }
   * - IPage: { content: { nodes: [...] } }
   */
  function getNodesArray(page: NonNullable<KernelState['page']>): unknown[] | null {
    if ('nodes' in page && Array.isArray(page.nodes)) return page.nodes;
    if ('content' in page && page.content && Array.isArray(page.content.nodes))
      return page.content.nodes;
    return null;
  }

  const command = {
    id,
    type: 'node.drop',
    payload,
    execute(state: KernelState): KernelState {
      const next = structuredClone(state);
      if (!next.page) return next;

      const nodes = getNodesArray(next.page);
      if (!nodes) return next;

      const nodeSchema: NodeSchemaType = {
        id: nodeId,
        type: payload.componentType,
        position: payload.position,
        props: payload.initialProps ?? {},
      };

      nodes.push(nodeSchema);

      next.nodesById[nodeId] = {
        id: nodeId,
        schemaRef: nodeSchema,
        visible: true,
        locked: false,
      };

      next.selection = { nodeIds: [nodeId] };
      return next;
    },
    undo(state: KernelState): KernelState {
      const next = structuredClone(state);
      if (!next.page) return next;

      const nodes = getNodesArray(next.page);
      if (!nodes) return next;

      const idx = nodes.findIndex((n: unknown) => (n as NodeSchemaType).id === nodeId);
      if (idx >= 0) nodes.splice(idx, 1);

      delete next.nodesById[nodeId];
      next.selection = { nodeIds: [] };

      return next;
    },
  };

  return command;
};

export default createNodeDropCommand;

/**
 * Action-backed node drop command (works with in-memory kernel.action API)
 * Useful for apps that use the kernel action API instead of KernelState.
 */
export const createNodeDropActionCommand = (
  pageId: string,
  payload: {
    nodeId?: string;
    componentType: string;
    initialProps?: Record<string, unknown>;
    position: { x: number; y: number };
    meta?: { source?: string };
  },
) => {
  const id = generateId('node');
  const nodeId = payload.nodeId ?? `${id}`;

  return {
    id,
    type: 'node.drop.action',
    payload,
    execute() {
      const node = {
        id: nodeId,
        widgetId: payload.componentType,
        x: payload.position.x,
        y: payload.position.y,
        props: payload.initialProps ?? {},
      };
      action.addNode(pageId, node as any);
      return nodeId;
    },
    undo() {
      action.removeNode(pageId, nodeId);
      return nodeId;
    },
  };
};
