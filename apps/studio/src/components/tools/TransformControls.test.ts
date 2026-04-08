import { describe, expect, it } from 'vitest';
import { getCanvasSnapGuidelines } from './TransformControls';

describe('TransformControls canvas snap guidelines', () => {
  it('builds edge and center guidelines from the canvas size', () => {
    expect(getCanvasSnapGuidelines({ width: 1920, height: 1080 })).toEqual({
      verticalGuidelines: [0, 960, 1920],
      horizontalGuidelines: [0, 540, 1080],
    });
  });

  it('returns empty guidelines for invalid canvas sizes', () => {
    expect(getCanvasSnapGuidelines({ width: 0, height: 1080 })).toEqual({
      verticalGuidelines: [],
      horizontalGuidelines: [0, 540, 1080],
    });
    expect(getCanvasSnapGuidelines(null)).toEqual({
      verticalGuidelines: [],
      horizontalGuidelines: [],
    });
  });
});
