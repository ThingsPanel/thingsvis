import type { KernelActions, KernelState, NodeState } from '@thingsvis/kernel';

type NudgeSelectionContext = Pick<KernelState, 'selection' | 'nodesById' | 'canvas'> &
  Pick<KernelActions, 'updateNode' | 'moveGridItemWithPosition'>;

type Delta = {
  x: number;
  y: number;
};

export function nudgeSelection(context: NudgeSelectionContext, delta: Delta): boolean {
  if (delta.x === 0 && delta.y === 0) {
    return false;
  }

  const selectedNodes = context.selection.nodeIds
    .map((id) => context.nodesById[id])
    .filter((node): node is NodeState => !!node && !node.locked);

  if (selectedNodes.length === 0) {
    return false;
  }

  if (context.canvas.mode === 'grid') {
    for (const node of selectedNodes) {
      const grid = (node.schemaRef.grid ?? {}) as Partial<{ x: number; y: number }>;
      context.moveGridItemWithPosition(node.id, {
        x: Math.max(0, (grid.x ?? 0) + delta.x),
        y: Math.max(0, (grid.y ?? 0) + delta.y),
      });
    }
    return true;
  }

  for (const node of selectedNodes) {
    const position = node.schemaRef.position ?? { x: 0, y: 0 };
    context.updateNode(node.id, {
      position: {
        x: position.x + delta.x,
        y: position.y + delta.y,
      },
    });
  }

  return true;
}
