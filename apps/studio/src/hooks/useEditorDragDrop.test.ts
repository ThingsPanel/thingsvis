import { describe, expect, it } from 'vitest';
import { resolveInitialNodeSize } from './useEditorDragDrop';

describe('resolveInitialNodeSize', () => {
  it('returns the widget default size for resizable widgets', () => {
    expect(
      resolveInitialNodeSize({
        defaultSize: { width: 100, height: 30 },
        resizable: true,
      }),
    ).toEqual({ width: 100, height: 30 });
  });

  it('applies min constraints when default size is smaller', () => {
    expect(
      resolveInitialNodeSize({
        defaultSize: { width: 8, height: 6 },
        resizable: true,
        constraints: { minWidth: 10, minHeight: 10 },
      }),
    ).toEqual({ width: 10, height: 10 });
  });

  it('omits size only for truly non-resizable widgets', () => {
    expect(
      resolveInitialNodeSize({
        defaultSize: { width: 160, height: 40 },
        resizable: false,
      }),
    ).toBeUndefined();
  });
});
