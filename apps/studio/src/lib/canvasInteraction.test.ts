import { describe, expect, it } from 'vitest';
import {
  DRAG_COMMIT_THRESHOLD_PX,
  resolveCanvasDragCommit,
  shouldCommitCanvasDrag,
} from './canvasInteraction';

describe('shouldCommitCanvasDrag', () => {
  it('rejects empty and tiny drags', () => {
    expect(shouldCommitCanvasDrag(null)).toBe(false);
    expect(shouldCommitCanvasDrag({ x: 0, y: 0 })).toBe(false);
    expect(shouldCommitCanvasDrag({ x: 1, y: 1 })).toBe(false);
    expect(
      shouldCommitCanvasDrag({ x: DRAG_COMMIT_THRESHOLD_PX - 1, y: 0 }, DRAG_COMMIT_THRESHOLD_PX),
    ).toBe(false);
  });

  it('accepts drags that cross the threshold', () => {
    expect(
      shouldCommitCanvasDrag({ x: DRAG_COMMIT_THRESHOLD_PX, y: 0 }, DRAG_COMMIT_THRESHOLD_PX),
    ).toBe(true);
    expect(shouldCommitCanvasDrag({ x: 2, y: 3 })).toBe(true);
  });

  it('commits position only after the threshold is crossed', () => {
    expect(resolveCanvasDragCommit({ x: 10, y: 20 }, { x: 1, y: 1 })).toBeNull();
    expect(resolveCanvasDragCommit({ x: 10, y: 20 }, { x: 3, y: 0 })).toEqual({
      x: 13,
      y: 20,
    });
  });
});
