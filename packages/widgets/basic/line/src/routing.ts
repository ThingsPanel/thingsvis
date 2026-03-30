export type Pt = { x: number; y: number };
export type AnchorType = 'top' | 'right' | 'bottom' | 'left' | 'center';

export function isHorizontal(a: Pt, b: Pt, eps = 1): boolean {
  return Math.abs(a.y - b.y) < eps;
}

export function isVertical(a: Pt, b: Pt, eps = 1): boolean {
  return Math.abs(a.x - b.x) < eps;
}

export function buildCurvedPathD(start: Pt, end: Pt): string {
  const dx = end.x - start.x;
  const c1 = { x: start.x + dx / 3, y: start.y };
  const c2 = { x: start.x + (dx * 2) / 3, y: end.y };
  return `M ${start.x} ${start.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${end.x} ${end.y}`;
}

export function pointsToPathD(points: Pt[]): string {
  if (!points || points.length === 0) return '';
  const first = points[0]!;
  let d = `M ${first.x} ${first.y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i]!.x} ${points[i]!.y}`;
  }
  return d;
}

/** Compute elbow route points for orthogonal routing */
export function buildOrthogonalRoute(
  start: Pt,
  end: Pt,
  sourceAnchor?: AnchorType,
  targetAnchor?: AnchorType,
  waypoints?: Pt[],
): Pt[] {
  const points = [start, ...(waypoints || []), end];
  if (points.length === 2) {
    return _buildSimpleElbow(start, end, sourceAnchor, targetAnchor);
  }
  return _orthogonalizePoints(points, sourceAnchor, targetAnchor);
}

function _buildSimpleElbow(
  a: Pt,
  b: Pt,
  sourceAnchor?: AnchorType,
  targetAnchor?: AnchorType,
): Pt[] {
  const sourceHorizontal = sourceAnchor === 'left' || sourceAnchor === 'right';
  const sourceVertical = sourceAnchor === 'top' || sourceAnchor === 'bottom';
  const targetHorizontal = targetAnchor === 'left' || targetAnchor === 'right';
  const targetVertical = targetAnchor === 'top' || targetAnchor === 'bottom';

  if (sourceVertical && targetVertical) {
    const midY = (a.y + b.y) / 2;
    return [a, { x: a.x, y: midY }, { x: b.x, y: midY }, b];
  }
  if (sourceHorizontal && targetHorizontal) {
    const midX = (a.x + b.x) / 2;
    return [a, { x: midX, y: a.y }, { x: midX, y: b.y }, b];
  }
  if (sourceVertical && targetHorizontal) {
    return [a, { x: a.x, y: b.y }, b];
  }
  if (sourceHorizontal && targetVertical) {
    return [a, { x: b.x, y: a.y }, b];
  }
  const midX = (a.x + b.x) / 2;
  return [a, { x: midX, y: a.y }, { x: midX, y: b.y }, b];
}

function _chooseElbow(
  a: Pt,
  b: Pt,
  prev?: Pt,
  next?: Pt,
  isFirst?: boolean,
  isLast?: boolean,
  sourceAnchor?: AnchorType,
  targetAnchor?: AnchorType,
): Pt {
  let firstLeg: 'horizontal' | 'vertical' | null = null;

  if (isFirst) {
    if (sourceAnchor === 'left' || sourceAnchor === 'right') firstLeg = 'horizontal';
    if (sourceAnchor === 'top' || sourceAnchor === 'bottom') firstLeg = 'vertical';
  }

  if (!firstLeg && prev) {
    if (isHorizontal(prev, a)) firstLeg = 'vertical';
    else if (isVertical(prev, a)) firstLeg = 'horizontal';
  }

  if (!firstLeg && next) {
    if (isHorizontal(b, next)) firstLeg = 'horizontal';
    else if (isVertical(b, next)) firstLeg = 'vertical';
  }

  if (!firstLeg && isLast) {
    if (targetAnchor === 'left' || targetAnchor === 'right') firstLeg = 'vertical';
    if (targetAnchor === 'top' || targetAnchor === 'bottom') firstLeg = 'horizontal';
  }

  if (!firstLeg) {
    firstLeg = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y) ? 'horizontal' : 'vertical';
  }

  return firstLeg === 'horizontal' ? { x: b.x, y: a.y } : { x: a.x, y: b.y };
}

function _orthogonalizePoints(
  points: Pt[],
  sourceAnchor?: AnchorType,
  targetAnchor?: AnchorType,
): Pt[] {
  if (points.length < 2) return points;
  const result: Pt[] = [points[0]!];

  for (let i = 1; i < points.length; i++) {
    const a = result[result.length - 1]!;
    const b = points[i]!;

    if (isHorizontal(a, b) || isVertical(a, b)) {
      result.push(b);
      continue;
    }

    const prev = result.length >= 2 ? result[result.length - 2] : undefined;
    const next = i < points.length - 1 ? points[i + 1] : undefined;
    const elbow = _chooseElbow(a, b, prev, next, i === 1, i === points.length - 1, sourceAnchor, targetAnchor);

    if (Math.abs(elbow.x - a.x) >= 1 || Math.abs(elbow.y - a.y) >= 1) {
      result.push(elbow);
    }
    result.push(b);
  }

  return result;
}

/** Simplify orthogonal point list: remove collinear, collapse tiny dogleg < threshold.
 *  ⚠️ MUST NOT reset to canonical route when length > 4. User adjustments are preserved. */
export function simplifyOrthogonal(points: Pt[], threshold = 20): Pt[] {
  if (!points || points.length < 2) return points;

  // 1. Orthogonalize points first so we only deal with axis-aligned segments
  const orthogonalized = _orthogonalizePoints(points);

  // 2. Remove collinear points
  const compacted: Pt[] = [orthogonalized[0]!];
  for (let i = 1; i < orthogonalized.length - 1; i++) {
    const prev = compacted[compacted.length - 1]!;
    const curr = orthogonalized[i]!;
    const next = orthogonalized[i + 1]!;

    const collinearX = isVertical(prev, curr) && isVertical(curr, next);
    const collinearY = isHorizontal(prev, curr) && isHorizontal(curr, next);
    if (collinearX || collinearY) continue;
    compacted.push(curr);
  }
  compacted.push(orthogonalized[orthogonalized.length - 1]!);

  // 3. Snap start/end if almost collinear (legacy PIPE_STRAIGHT_SNAP_THRESHOLD behavior)
  if (compacted.length >= 2) {
    const start = compacted[0]!;
    const end = compacted[compacted.length - 1]!;
    if (Math.abs(start.y - end.y) <= threshold) {
      // Note: in previous code it replaced all points with [start, { x: end.x, y: start.y }]
      // To strictly preserve user waypoints, we only do this if it's close to a straight line
      if (compacted.length === 2 || compacted.length === 3) {
          return [start, { x: end.x, y: start.y }];
      }
    }
    if (Math.abs(start.x - end.x) <= threshold) {
      if (compacted.length === 2 || compacted.length === 3) {
          return [start, { x: start.x, y: end.y }];
      }
    }
  }

  // 4. Return without checking length > 4
  return compacted;
}
