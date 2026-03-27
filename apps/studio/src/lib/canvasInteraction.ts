export const DRAG_COMMIT_THRESHOLD_PX = 3;

export type CanvasDragDelta = { x: number; y: number };
export type CanvasPoint = { x: number; y: number };

export function shouldCommitCanvasDrag(
  delta: CanvasDragDelta | null | undefined,
  threshold = DRAG_COMMIT_THRESHOLD_PX,
): boolean {
  if (!delta) return false;

  return Math.hypot(delta.x ?? 0, delta.y ?? 0) >= threshold;
}

export function resolveCanvasDragCommit(
  base: CanvasPoint,
  delta: CanvasDragDelta | null | undefined,
  threshold = DRAG_COMMIT_THRESHOLD_PX,
): CanvasPoint | null {
  if (!shouldCommitCanvasDrag(delta, threshold)) {
    return null;
  }

  return {
    x: (base.x ?? 0) + (delta?.x ?? 0),
    y: (base.y ?? 0) + (delta?.y ?? 0),
  };
}
