import { describe, expect, it } from 'vitest';
import {
  ASPECT_RATIO_PROP,
  KEEP_ASPECT_RATIO_PROP,
  getAspectRatioFromSize,
  getStoredAspectRatio,
  isAspectRatioLocked,
  resizeDimensionWithAspectRatio,
} from './aspectRatio';

describe('aspectRatio helpers', () => {
  it('reads aspect ratio from a valid size', () => {
    expect(getAspectRatioFromSize(212, 132)).toBeCloseTo(212 / 132);
  });

  it('ignores invalid sizes', () => {
    expect(getAspectRatioFromSize(212, 0)).toBeUndefined();
    expect(getAspectRatioFromSize(undefined, 132)).toBeUndefined();
  });

  it('reads editor-only aspect ratio flags from props', () => {
    const props = {
      [KEEP_ASPECT_RATIO_PROP]: true,
      [ASPECT_RATIO_PROP]: 1.6,
    };

    expect(isAspectRatioLocked(props)).toBe(true);
    expect(getStoredAspectRatio(props)).toBe(1.6);
  });

  it('defaults to locked unless explicitly disabled', () => {
    expect(isAspectRatioLocked(undefined)).toBe(true);
    expect(isAspectRatioLocked({ [KEEP_ASPECT_RATIO_PROP]: false })).toBe(false);
  });

  it('resizes by width while preserving ratio', () => {
    const next = resizeDimensionWithAspectRatio('width', 240, 16 / 10);

    expect(next.width).toBe(240);
    expect(next.height).toBeCloseTo(150);
  });

  it('resizes by height while preserving ratio', () => {
    const next = resizeDimensionWithAspectRatio('height', 150, 16 / 10);

    expect(next.width).toBeCloseTo(240);
    expect(next.height).toBe(150);
  });

  it('respects min constraints from either axis', () => {
    const next = resizeDimensionWithAspectRatio('width', 40, 2, {
      minWidth: 60,
      minHeight: 40,
    });

    expect(next.width).toBe(80);
    expect(next.height).toBe(40);
  });

  it('respects max constraints from either axis', () => {
    const next = resizeDimensionWithAspectRatio('height', 200, 2, {
      maxWidth: 180,
      maxHeight: 120,
    });

    expect(next.width).toBe(180);
    expect(next.height).toBe(90);
  });
});
