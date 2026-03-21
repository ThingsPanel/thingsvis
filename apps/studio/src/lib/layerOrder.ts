import type { NodeState } from '@thingsvis/kernel';

export function orderNodeStatesByLayerOrder(
  nodesById: Record<string, NodeState>,
  layerOrder: string[],
): NodeState[] {
  const ordered = layerOrder
    .map((id) => nodesById[id])
    .filter((node): node is NodeState => Boolean(node));

  const seen = new Set(ordered.map((node) => node.id));
  const extras = Object.values(nodesById).filter((node) => !seen.has(node.id));

  return [...ordered, ...extras];
}
