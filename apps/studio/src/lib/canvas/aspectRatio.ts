export const KEEP_ASPECT_RATIO_PROP = '_keepAspectRatio';
export const ASPECT_RATIO_PROP = '_aspectRatio';

type AspectRatioProps = Record<string, unknown> | null | undefined;

export type AspectRatioConstraints = {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
};

function isPositiveFinite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) {
    return min;
  }
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

export function getAspectRatioFromSize(
  width: number | null | undefined,
  height: number | null | undefined,
): number | undefined {
  if (!isPositiveFinite(width) || !isPositiveFinite(height)) {
    return undefined;
  }
  return width / height;
}

export function isAspectRatioLocked(props: AspectRatioProps): boolean {
  return props?.[KEEP_ASPECT_RATIO_PROP] === true;
}

export function getStoredAspectRatio(props: AspectRatioProps): number | undefined {
  const value = props?.[ASPECT_RATIO_PROP];
  return isPositiveFinite(value) ? value : undefined;
}

export function resizeDimensionWithAspectRatio(
  dimension: 'width' | 'height',
  value: number,
  aspectRatio: number,
  constraints: AspectRatioConstraints = {},
): { width: number; height: number } {
  if (!isPositiveFinite(aspectRatio) || !Number.isFinite(value)) {
    return { width: value, height: value };
  }

  const minWidth = constraints.minWidth ?? 0;
  const minHeight = constraints.minHeight ?? 0;
  const maxWidth = constraints.maxWidth ?? Number.POSITIVE_INFINITY;
  const maxHeight = constraints.maxHeight ?? Number.POSITIVE_INFINITY;

  if (dimension === 'width') {
    const effectiveMinWidth = Math.max(minWidth, minHeight * aspectRatio);
    const effectiveMaxWidth = Math.min(maxWidth, maxHeight * aspectRatio);
    const width = clamp(value, effectiveMinWidth, effectiveMaxWidth);
    return { width, height: width / aspectRatio };
  }

  const effectiveMinHeight = Math.max(minHeight, minWidth / aspectRatio);
  const effectiveMaxHeight = Math.min(maxHeight, maxWidth / aspectRatio);
  const height = clamp(value, effectiveMinHeight, effectiveMaxHeight);
  return { width: height * aspectRatio, height };
}
