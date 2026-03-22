export const DRAG_COMMIT_THRESHOLD_PX = 3;

export function shouldCommitCanvasDrag(
  delta: { x: number; y: number } | null | undefined,
  threshold = DRAG_COMMIT_THRESHOLD_PX,
): boolean {
  if (!delta) return false;
  return Math.hypot(delta.x ?? 0, delta.y ?? 0) >= threshold;
}

export function extractCanvasNodeIdFromTarget(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) {
    return null;
  }

  const matched = target.closest('[data-node-id], [data-overlay-node-id]') as HTMLElement | null;
  if (!matched) return null;

  return matched.dataset.nodeId ?? matched.dataset.overlayNodeId ?? null;
}
