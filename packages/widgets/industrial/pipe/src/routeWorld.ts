/**
 * Single source of truth for industrial/pipe polyline geometry (local space, before SVG bbox padding).
 * Used by the widget renderer and by Studio PipeConnectionTool so handles match the drawn path.
 */

import type { Props } from './schema';

export type Pt = { x: number; y: number };
type AnchorType = 'top' | 'right' | 'bottom' | 'left' | 'center';
type PipeAnchorType = AnchorType;

type LinkedNodeInfo = {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
};

type NodeBounds = {
  position: { x: number; y: number };
  size: { width: number; height: number };
};

type Viewport = { zoom: number; offsetX: number; offsetY: number };
type PipeDirection = 'left' | 'right' | 'up' | 'down';
type PipeCorridorConstraint =
  | { kind: 'horizontal'; value: number }
  | { kind: 'vertical'; value: number };

export function getPipeRoutePadding(strokeWidth?: unknown): number {
  const width = Number(strokeWidth ?? 12);
  const clamped = Number.isFinite(width) ? Math.max(1, Math.min(80, width)) : 12;
  return Math.max(20, clamped * 2 + 12);
}

function pipeIsHorizontal(a: Pt, b: Pt, eps = 1): boolean {
  return Math.abs(a.y - b.y) < eps;
}

function pipeIsVertical(a: Pt, b: Pt, eps = 1): boolean {
  return Math.abs(a.x - b.x) < eps;
}

function pipeSegmentDirection(a: Pt, b: Pt): PipeDirection | null {
  if (pipeIsHorizontal(a, b)) return b.x >= a.x ? 'right' : 'left';
  if (pipeIsVertical(a, b)) return b.y >= a.y ? 'down' : 'up';
  return null;
}

function pipeIsReverseDirection(a: PipeDirection, b: PipeDirection): boolean {
  return (
    (a === 'left' && b === 'right') ||
    (a === 'right' && b === 'left') ||
    (a === 'up' && b === 'down') ||
    (a === 'down' && b === 'up')
  );
}

function pipeOutgoingDirections(anchor?: PipeAnchorType): PipeDirection[] {
  switch (anchor) {
    case 'left':
      return ['left'];
    case 'right':
      return ['right'];
    case 'top':
      return ['up'];
    case 'bottom':
      return ['down'];
    case 'center':
    default:
      return ['left', 'right', 'up', 'down'];
  }
}

function pipeIncomingDirections(anchor?: PipeAnchorType): PipeDirection[] {
  switch (anchor) {
    case 'left':
      return ['right'];
    case 'right':
      return ['left'];
    case 'top':
      return ['down'];
    case 'bottom':
      return ['up'];
    case 'center':
    default:
      return ['left', 'right', 'up', 'down'];
  }
}

function pipeUniqueSorted(values: number[]): number[] {
  return Array.from(new Set(values.map((value) => Number(value.toFixed(3))))).sort((a, b) => a - b);
}

function pipeRouteLength(points: Pt[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += Math.abs(points[i]!.x - points[i - 1]!.x) + Math.abs(points[i]!.y - points[i - 1]!.y);
  }
  return length;
}

function pipeRouteRespectsAnchors(
  points: Pt[],
  sourceAnchor?: PipeAnchorType,
  targetAnchor?: PipeAnchorType,
): boolean {
  if (points.length < 2) return true;
  const firstDir = pipeSegmentDirection(points[0]!, points[1]!);
  const lastDir = pipeSegmentDirection(points[points.length - 2]!, points[points.length - 1]!);
  if (!firstDir || !lastDir) return false;
  return (
    pipeOutgoingDirections(sourceAnchor).includes(firstDir) &&
    pipeIncomingDirections(targetAnchor).includes(lastDir)
  );
}

function pipeShouldPreferShortestRoute(
  candidate: Pt[],
  shortest: Pt[],
  sourceAnchor?: PipeAnchorType,
  targetAnchor?: PipeAnchorType,
): boolean {
  if (candidate.length <= 2) return false;
  if (!pipeRouteRespectsAnchors(candidate, sourceAnchor, targetAnchor)) return true;
  const candidateLength = pipeRouteLength(candidate);
  const shortestLength = pipeRouteLength(shortest);
  if (candidate.length > shortest.length && candidateLength >= shortestLength - 0.5) return true;
  return candidateLength > shortestLength + 40;
}

function pipeEdgeUsesCorridor(a: Pt, b: Pt, corridor?: PipeCorridorConstraint): boolean {
  if (!corridor) return false;
  if (corridor.kind === 'horizontal') {
    return pipeIsHorizontal(a, b) && Math.abs(a.y - corridor.value) < 0.5 && Math.abs(a.x - b.x) > 0.5;
  }
  return pipeIsVertical(a, b) && Math.abs(a.x - corridor.value) < 0.5 && Math.abs(a.y - b.y) > 0.5;
}

function pipeBuildShortestRoute(
  start: Pt,
  end: Pt,
  sourceAnchor?: PipeAnchorType,
  targetAnchor?: PipeAnchorType,
  corridor?: PipeCorridorConstraint,
): Pt[] {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);
  const span = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y), 40);
  const pad = Math.max(40, Math.min(180, span * 0.5));

  const xVals = pipeUniqueSorted([
    start.x,
    end.x,
    (start.x + end.x) / 2,
    minX - pad,
    maxX + pad,
    ...(corridor?.kind === 'vertical' ? [corridor.value] : []),
  ]);
  const yVals = pipeUniqueSorted([
    start.y,
    end.y,
    (start.y + end.y) / 2,
    minY - pad,
    maxY + pad,
    ...(corridor?.kind === 'horizontal' ? [corridor.value] : []),
  ]);

  const startXIndex = xVals.findIndex((value) => Math.abs(value - start.x) < 0.5);
  const startYIndex = yVals.findIndex((value) => Math.abs(value - start.y) < 0.5);
  const endXIndex = xVals.findIndex((value) => Math.abs(value - end.x) < 0.5);
  const endYIndex = yVals.findIndex((value) => Math.abs(value - end.y) < 0.5);
  if (startXIndex < 0 || startYIndex < 0 || endXIndex < 0 || endYIndex < 0) {
    return pipeSimplifyOrthogonal([start, end]);
  }

  const allowedStartDirs = new Set(pipeOutgoingDirections(sourceAnchor));
  const allowedEndDirs = new Set(pipeIncomingDirections(targetAnchor));

  type State = {
    x: number;
    y: number;
    prevDir: PipeDirection | 'start';
    usedCorridor: boolean;
  };

  const keyOf = (state: State) => `${state.x}:${state.y}:${state.prevDir}:${state.usedCorridor ? 1 : 0}`;
  const pointOf = (state: State): Pt => ({ x: xVals[state.x]!, y: yVals[state.y]! });

  const startState: State = {
    x: startXIndex,
    y: startYIndex,
    prevDir: 'start',
    usedCorridor: false,
  };
  const startKey = keyOf(startState);
  const dist = new Map<string, number>([[startKey, 0]]);
  const prev = new Map<string, string | null>([[startKey, null]]);
  const states = new Map<string, State>([[startKey, startState]]);
  const queue: Array<{ key: string; cost: number }> = [{ key: startKey, cost: 0 }];

  const pushState = (state: State, cost: number, previousKey: string) => {
    const key = keyOf(state);
    const current = dist.get(key);
    if (current != null && current <= cost) return;
    dist.set(key, cost);
    prev.set(key, previousKey);
    states.set(key, state);
    queue.push({ key, cost });
  };

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const currentEntry = queue.shift()!;
    const currentCost = dist.get(currentEntry.key);
    if (currentCost == null || currentCost !== currentEntry.cost) continue;
    const current = states.get(currentEntry.key)!;

    if (
      current.x === endXIndex &&
      current.y === endYIndex &&
      (!corridor || current.usedCorridor)
    ) {
      const path: Pt[] = [];
      let cursorKey: string | null = currentEntry.key;
      while (cursorKey) {
        path.push(pointOf(states.get(cursorKey)!));
        cursorKey = prev.get(cursorKey) ?? null;
      }
      path.reverse();
      const simplified = pipeSimplifyOrthogonal(path);
      return pipeRouteRespectsAnchors(simplified, sourceAnchor, targetAnchor) ? simplified : path;
    }

    const neighbors: State[] = [];
    if (current.x > 0) neighbors.push({ ...current, x: current.x - 1 });
    if (current.x < xVals.length - 1) neighbors.push({ ...current, x: current.x + 1 });
    if (current.y > 0) neighbors.push({ ...current, y: current.y - 1 });
    if (current.y < yVals.length - 1) neighbors.push({ ...current, y: current.y + 1 });

    for (const next of neighbors) {
      const from = pointOf(current);
      const to = pointOf(next);
      const dir = pipeSegmentDirection(from, to);
      if (!dir) continue;
      if (current.prevDir === 'start' && !allowedStartDirs.has(dir)) continue;
      if (next.x === endXIndex && next.y === endYIndex && !allowedEndDirs.has(dir)) continue;

      const usedCorridor = current.usedCorridor || pipeEdgeUsesCorridor(from, to, corridor);
      const stepLength = Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
      const bendPenalty = current.prevDir !== 'start' && current.prevDir !== dir ? 0.01 : 0;
      const reversePenalty =
        current.prevDir !== 'start' && pipeIsReverseDirection(current.prevDir, dir) ? 20 : 0;
      const cost = currentCost + stepLength + bendPenalty + reversePenalty;

      pushState(
        {
          x: next.x,
          y: next.y,
          prevDir: dir,
          usedCorridor,
        },
        cost,
        currentEntry.key,
      );
    }
  }

  return pipeSimplifyOrthogonal([start, end]);
}

function pipeBuildSimpleElbow(
  a: Pt,
  b: Pt,
  sourceAnchor?: PipeAnchorType,
  targetAnchor?: PipeAnchorType,
): Pt[] {
  if (pipeIsHorizontal(a, b) || pipeIsVertical(a, b)) {
    return [a, b];
  }
  return pipeBuildShortestRoute(a, b, sourceAnchor, targetAnchor);
}

function pipeChooseElbow(
  a: Pt,
  b: Pt,
  prev?: Pt,
  next?: Pt,
  isFirst?: boolean,
  isLast?: boolean,
  sourceAnchor?: PipeAnchorType,
  targetAnchor?: PipeAnchorType,
): Pt {
  let firstLeg: 'horizontal' | 'vertical' | null = null;

  if (isFirst) {
    if (sourceAnchor === 'left' || sourceAnchor === 'right') firstLeg = 'horizontal';
    if (sourceAnchor === 'top' || sourceAnchor === 'bottom') firstLeg = 'vertical';
  }

  if (!firstLeg && prev) {
    if (pipeIsHorizontal(prev, a)) firstLeg = 'vertical';
    else if (pipeIsVertical(prev, a)) firstLeg = 'horizontal';
  }

  if (!firstLeg && next) {
    if (pipeIsHorizontal(b, next)) firstLeg = 'horizontal';
    else if (pipeIsVertical(b, next)) firstLeg = 'vertical';
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

function pipeBuildOrthogonalRoute(
  start: Pt,
  end: Pt,
  sourceAnchor?: PipeAnchorType,
  targetAnchor?: PipeAnchorType,
  waypoints?: Pt[],
): Pt[] {
  const pts = [start, ...(waypoints || []), end];
  if (pts.length < 2) return [start, end];
  if (pts.length === 2) {
    return pipeBuildSimpleElbow(pts[0]!, pts[1]!, sourceAnchor, targetAnchor);
  }
  const result: Pt[] = [pts[0]!];
  for (let i = 1; i < pts.length; i++) {
    const a = result[result.length - 1]!;
    const b = pts[i]!;
    if (pipeIsHorizontal(a, b) || pipeIsVertical(a, b)) {
      result.push(b);
      continue;
    }

    const prev = result.length >= 2 ? result[result.length - 2] : undefined;
    const next = i < pts.length - 1 ? pts[i + 1] : undefined;
    const elbow = pipeChooseElbow(
      a,
      b,
      prev,
      next,
      i === 1,
      i === pts.length - 1,
      sourceAnchor,
      targetAnchor,
    );
    if (!pipePointsEqual(a, elbow)) {
      result.push(elbow);
    }
    result.push(b);
  }
  return result;
}

function pipePointsEqual(a: Pt, b: Pt, eps = 0.5): boolean {
  return Math.abs(a.x - b.x) <= eps && Math.abs(a.y - b.y) <= eps;
}

function pipePointOnSegment(point: Pt, a: Pt, b: Pt, eps = 0.5): boolean {
  const minX = Math.min(a.x, b.x) - eps;
  const maxX = Math.max(a.x, b.x) + eps;
  const minY = Math.min(a.y, b.y) - eps;
  const maxY = Math.max(a.y, b.y) + eps;
  return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
}

function pipeConcatRoutes(...routes: Pt[][]): Pt[] {
  const result: Pt[] = [];
  for (const route of routes) {
    for (const point of route) {
      if (!result.length || !pipePointsEqual(result[result.length - 1]!, point)) {
        result.push(point);
      }
    }
  }
  return result;
}

function pipeCollapseUTurns(points: Pt[]): Pt[] {
  const result = points.map((point) => ({ ...point }));
  let changed = true;
  while (changed && result.length >= 4) {
    changed = false;
    for (let i = 0; i <= result.length - 4; i++) {
      const a = result[i]!;
      const b = result[i + 1]!;
      const c = result[i + 2]!;
      const d = result[i + 3]!;
      const abHorizontal = pipeIsHorizontal(a, b);
      const bcHorizontal = pipeIsHorizontal(b, c);
      const cdHorizontal = pipeIsHorizontal(c, d);
      if (abHorizontal === bcHorizontal || bcHorizontal === cdHorizontal || abHorizontal !== cdHorizontal) {
        continue;
      }
      if (abHorizontal && Math.abs(a.y - d.y) <= 0.5) {
        result.splice(i + 1, 3, { x: d.x, y: a.y });
        changed = true;
        break;
      }
      if (!abHorizontal && Math.abs(a.x - d.x) <= 0.5) {
        result.splice(i + 1, 3, { x: a.x, y: d.y });
        changed = true;
        break;
      }
    }
  }
  return result;
}

function pipeSegmentIntersection(a1: Pt, a2: Pt, b1: Pt, b2: Pt): Pt | null {
  if (pipeIsHorizontal(a1, a2) && pipeIsVertical(b1, b2)) {
    const point = { x: b1.x, y: a1.y };
    if (pipePointOnSegment(point, a1, a2) && pipePointOnSegment(point, b1, b2)) {
      return point;
    }
  }
  if (pipeIsVertical(a1, a2) && pipeIsHorizontal(b1, b2)) {
    const point = { x: a1.x, y: b1.y };
    if (pipePointOnSegment(point, a1, a2) && pipePointOnSegment(point, b1, b2)) {
      return point;
    }
  }
  return null;
}

function pipeCollapseSelfIntersections(points: Pt[]): Pt[] {
  let current = points.map((point) => ({ ...point }));
  let changed = true;
  while (changed && current.length >= 4) {
    changed = false;
    for (let i = 0; i < current.length - 1; i++) {
      for (let j = i + 2; j < current.length - 1; j++) {
        if (i === 0 && j === current.length - 2) continue;
        const a1 = current[i]!;
        const a2 = current[i + 1]!;
        const b1 = current[j]!;
        const b2 = current[j + 1]!;
        const intersection = pipeSegmentIntersection(a1, a2, b1, b2);
        if (!intersection) continue;

        const prefix = current.slice(0, i + 1);
        const suffix = current.slice(j + 1);
        current = pipeConcatRoutes(prefix, [intersection], suffix);
        changed = true;
        break;
      }
      if (changed) break;
    }
  }
  return current;
}

function pipeSimplifyOrthogonal(points: Pt[]): Pt[] {
  if (!points || points.length < 2) return points;
  let current = points.map((point) => ({ ...point }));

  for (let pass = 0; pass < 6; pass++) {
    const deduped: Pt[] = [];
    for (const point of current) {
      if (!deduped.length || !pipePointsEqual(deduped[deduped.length - 1]!, point)) {
        deduped.push(point);
      }
    }
    if (deduped.length < 2) return deduped;

    const compacted: Pt[] = [deduped[0]!];
    for (let i = 1; i < deduped.length - 1; i++) {
      const prev = compacted[compacted.length - 1]!;
      const curr = deduped[i]!;
      const next = deduped[i + 1]!;
      const collinearX = pipeIsHorizontal(prev, curr) && pipeIsHorizontal(curr, next);
      const collinearY = pipeIsVertical(prev, curr) && pipeIsVertical(curr, next);
      if (collinearX || collinearY) continue;
      compacted.push(curr);
    }
    compacted.push(deduped[deduped.length - 1]!);

    const collapsedUTurns = pipeCollapseUTurns(compacted);
    const collapsedIntersections = pipeCollapseSelfIntersections(collapsedUTurns);
    if (
      collapsedIntersections.length === current.length &&
      collapsedIntersections.every((point, index) => pipePointsEqual(point, current[index]!))
    ) {
      return collapsedIntersections;
    }
    current = collapsedIntersections;
  }

  return current;
}

function pipeCollapseFreeTerminalJog(
  points: Pt[],
  options: {
    collapseStart?: boolean;
    collapseEnd?: boolean;
    threshold?: number;
  },
): Pt[] {
  const threshold = Math.max(1, options.threshold ?? 12);
  let current = pipeSimplifyOrthogonal(points);

  if (options.collapseStart && current.length === 4) {
    const a = current[0]!;
    const b = current[1]!;
    const c = current[2]!;
    const d = current[3]!;
    const middleLength = Math.abs(c.x - b.x) + Math.abs(c.y - b.y);
    if (middleLength <= threshold) {
      const firstHorizontal = pipeIsHorizontal(a, b);
      const lastHorizontal = pipeIsHorizontal(c, d);
      const firstVertical = pipeIsVertical(a, b);
      const lastVertical = pipeIsVertical(c, d);
      if (firstHorizontal && lastHorizontal) {
        current = pipeSimplifyOrthogonal([
          { x: a.x, y: a.y },
          { x: d.x, y: a.y },
        ]);
      } else if (firstVertical && lastVertical) {
        current = pipeSimplifyOrthogonal([
          { x: a.x, y: a.y },
          { x: a.x, y: d.y },
        ]);
      }
    }
  }

  if (options.collapseEnd && current.length === 4) {
    const a = current[0]!;
    const b = current[1]!;
    const c = current[2]!;
    const d = current[3]!;
    const middleLength = Math.abs(c.x - b.x) + Math.abs(c.y - b.y);
    if (middleLength <= threshold) {
      const firstHorizontal = pipeIsHorizontal(a, b);
      const lastHorizontal = pipeIsHorizontal(c, d);
      const firstVertical = pipeIsVertical(a, b);
      const lastVertical = pipeIsVertical(c, d);
      if (firstHorizontal && lastHorizontal) {
        current = pipeSimplifyOrthogonal([
          { x: a.x, y: d.y },
          { x: d.x, y: d.y },
        ]);
      } else if (firstVertical && lastVertical) {
        current = pipeSimplifyOrthogonal([
          { x: d.x, y: a.y },
          { x: d.x, y: d.y },
        ]);
      }
    }
  }

  if (options.collapseStart && current.length >= 3) {
    const start = current[0]!;
    const elbow = current[1]!;
    const next = current[2]!;
    const startLength = Math.abs(elbow.x - start.x) + Math.abs(elbow.y - start.y);
    const elbowToNextHorizontal = pipeIsHorizontal(elbow, next);
    const elbowToNextVertical = pipeIsVertical(elbow, next);
    if (startLength <= threshold && (elbowToNextHorizontal || elbowToNextVertical)) {
      current = pipeSimplifyOrthogonal([
        elbowToNextHorizontal ? { x: start.x, y: elbow.y } : { x: elbow.x, y: start.y },
        ...current.slice(1),
      ]);
    }
  }

  if (options.collapseEnd && current.length >= 3) {
    const prev = current[current.length - 3]!;
    const elbow = current[current.length - 2]!;
    const end = current[current.length - 1]!;
    const endLength = Math.abs(end.x - elbow.x) + Math.abs(end.y - elbow.y);
    const prevToElbowHorizontal = pipeIsHorizontal(prev, elbow);
    const prevToElbowVertical = pipeIsVertical(prev, elbow);
    if (endLength <= threshold && (prevToElbowHorizontal || prevToElbowVertical)) {
      current = pipeSimplifyOrthogonal([
        ...current.slice(0, -1),
        prevToElbowHorizontal ? { x: end.x, y: elbow.y } : { x: elbow.x, y: end.y },
      ]);
    }
  }

  return current;
}

function worldToLocal(worldPt: Pt, nodePosition: Pt): Pt {
  return {
    x: worldPt.x - nodePosition.x,
    y: worldPt.y - nodePosition.y,
  };
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function rotatePt(pt: Pt, origin: Pt, angleDeg: number): Pt {
  if (angleDeg === 0) return { x: pt.x, y: pt.y };
  const rad = degToRad(angleDeg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = pt.x - origin.x;
  const dy = pt.y - origin.y;
  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  };
}

function getTargetAnchorWorld(
  targetNode:
    | LinkedNodeInfo
    | {
        schemaRef?: {
          position?: Pt;
          size?: { width: number; height: number };
          props?: { _rotation?: number; rotation?: number };
          rotation?: number;
        };
      },
  anchor: AnchorType,
): Pt {
  const schema =
    'schemaRef' in targetNode && targetNode.schemaRef
      ? (targetNode.schemaRef as any)
      : (targetNode as any);
  const pos = schema?.position ?? { x: 0, y: 0 };
  const sz = schema?.size ?? { width: 100, height: 100 };
  const rotation = schema?.props?._rotation ?? schema?.props?.rotation ?? schema?.rotation ?? 0;
  const cx = pos.x + sz.width / 2;
  const cy = pos.y + sz.height / 2;
  const center: Pt = { x: cx, y: cy };
  let local: Pt;
  switch (anchor) {
    case 'top':
      local = { x: cx, y: pos.y };
      break;
    case 'right':
      local = { x: pos.x + sz.width, y: cy };
      break;
    case 'bottom':
      local = { x: cx, y: pos.y + sz.height };
      break;
    case 'left':
      local = { x: pos.x, y: cy };
      break;
    default:
      local = { x: cx, y: cy };
  }
  if (rotation === 0) return local;
  return rotatePt(local, center, rotation);
}

function getAnchorPoint(node: LinkedNodeInfo | NodeBounds, anchor: AnchorType = 'center'): Pt {
  const { position, size } = node;
  const cx = position.x + size.width / 2;
  const cy = position.y + size.height / 2;
  switch (anchor) {
    case 'top':
      return { x: cx, y: position.y };
    case 'right':
      return { x: position.x + size.width, y: cy };
    case 'bottom':
      return { x: cx, y: position.y + size.height };
    case 'left':
      return { x: position.x, y: cy };
    case 'center':
    default:
      return { x: cx, y: cy };
  }
}

/** Canvas container for viewport math: Studio passes containerRef; fallback = #visual-engine-mount parent. */
function getCanvasContainerRect(containerEl?: HTMLElement | null): DOMRect {
  if (containerEl) return containerEl.getBoundingClientRect();
  const mount = document.getElementById('visual-engine-mount');
  return mount?.parentElement?.getBoundingClientRect() ?? new DOMRect();
}

function getPortWorldPosition(
  nodeId: string,
  portId: string,
  viewport: Viewport,
  containerEl?: HTMLElement | null,
): Pt | null {
  const el =
    document.querySelector<HTMLElement>(`.thingsvis-widget-layer [data-overlay-node-id="${nodeId}"] [data-port-id="${portId}"]`) ??
    document.querySelector<HTMLElement>(`.thingsvis-widget-layer [data-node-id="${nodeId}"][data-port-id="${portId}"]`) ??
    document.querySelector<HTMLElement>(`.proxy-layer [data-node-id="${nodeId}"][data-port-id="${portId}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const containerRect = getCanvasContainerRect(containerEl);
  return {
    x: (rect.left + rect.width / 2 - containerRect.left - viewport.offsetX) / viewport.zoom,
    y: (rect.top + rect.height / 2 - containerRect.top - viewport.offsetY) / viewport.zoom,
  };
}

export function getPipeNodeWorldBoundsFromDom(
  nodeId: string,
  viewport?: Viewport,
  containerEl?: HTMLElement | null,
): NodeBounds | null {
  const nodeEl =
    document.querySelector<HTMLElement>(`.thingsvis-widget-layer [data-overlay-node-id="${nodeId}"]`) ??
    document.querySelector<HTMLElement>(`.thingsvis-widget-layer [data-node-id="${nodeId}"]`) ??
    document.querySelector<HTMLElement>(`.proxy-layer .node-proxy-target[data-node-id="${nodeId}"]`);
  if (!nodeEl) return null;
  const rect = nodeEl.getBoundingClientRect();
  const zoom = Math.max(0.0001, viewport?.zoom ?? 1);

  if (viewport) {
    const containerRect = getCanvasContainerRect(containerEl);
    return {
      position: {
        x: (rect.left - containerRect.left - viewport.offsetX) / zoom,
        y: (rect.top - containerRect.top - viewport.offsetY) / zoom,
      },
      size: {
        width: rect.width / zoom,
        height: rect.height / zoom,
      },
    };
  }

  const x = parseFloat(nodeEl.style.left || '0');
  const y = parseFloat(nodeEl.style.top || '0');
  const w = parseFloat(nodeEl.style.width || String(rect.width || 100));
  const h = parseFloat(nodeEl.style.height || String(rect.height || 100));
  return { position: { x, y }, size: { width: w, height: h } };
}

function clampMinSize(size?: { width: number; height: number }) {
  return {
    width: Math.max(1, Number(size?.width ?? 0)),
    height: Math.max(1, Number(size?.height ?? 0)),
  };
}

function migrateOldPoints(points?: Pt[]): Pt[] {
  if (!points || points.length < 2) return [];
  return points.slice(1, -1);
}

function worldToLocalPoints(points: Pt[], nodePosition: Pt): Pt[] {
  return points.map((point) => worldToLocal(point, nodePosition));
}

function normalizeLocalRoutePoints(points?: Pt[]): Pt[] {
  if (!Array.isArray(points) || points.length < 2) return [];
  const normalized = points.map((point) => ({ x: point.x, y: point.y }));
  if (normalized.length === 2) {
    const start = normalized[0]!;
    const end = normalized[1]!;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    if (Math.abs(dy) <= 2) {
      return pipeSimplifyOrthogonal([start, { x: end.x, y: start.y }]);
    }
    if (Math.abs(dx) <= 2) {
      return pipeSimplifyOrthogonal([start, { x: start.x, y: end.y }]);
    }
    return pipeSimplifyOrthogonal(pipeBuildSimpleElbow(start, end));
  }
  return pipeSimplifyOrthogonal(normalized);
}

function buildDefaultLocalEndpoints(size: { width: number; height: number }) {
  return {
    start: { x: 0, y: size.height / 2 },
    end: { x: size.width, y: size.height / 2 },
  };
}

export function buildFreePipeLocalPoints(size: { width: number; height: number }) {
  if (size.height > size.width) {
    const centerX = size.width / 2;
    return [
      { x: centerX, y: 0 },
      { x: centerX, y: size.height },
    ];
  }

  const centerY = size.height / 2;
  return [
    { x: 0, y: centerY },
    { x: size.width, y: centerY },
  ];
}

function clampToRange(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getRouteBounds(points: Pt[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return { minX, minY, maxX, maxY };
}

function isStraightFreeRoute(points: Pt[]): boolean {
  if (points.length !== 2) return false;
  return pipeIsHorizontal(points[0]!, points[1]!) || pipeIsVertical(points[0]!, points[1]!);
}

function routeEscapesNodeBox(
  points: Pt[],
  size: { width: number; height: number },
  tolerance = 2,
): boolean {
  if (!points.length) return false;
  const bounds = getRouteBounds(points);
  return (
    bounds.minX < -tolerance ||
    bounds.minY < -tolerance ||
    bounds.maxX > size.width + tolerance ||
    bounds.maxY > size.height + tolerance
  );
}

function fitStraightFreeRouteToNodeBox(
  points: Pt[],
  size: { width: number; height: number },
): Pt[] {
  if (!isStraightFreeRoute(points)) return points;
  const canonical = buildFreePipeLocalPoints(size);
  const start = canonical[0]!;
  const end = canonical[1]!;
  const source = points[0]!;
  const target = points[1]!;
  if (Math.abs(target.x - source.x) >= Math.abs(target.y - source.y)) {
    const y = clampToRange((source.y + target.y) / 2, 0, size.height);
    return start.y === end.y ? [{ x: start.x, y }, { x: end.x, y }] : [{ x: 0, y }, { x: size.width, y }];
  }
  const x = clampToRange((source.x + target.x) / 2, 0, size.width);
  return start.x === end.x ? [{ x, y: start.y }, { x, y: end.y }] : [{ x, y: 0 }, { x, y: size.height }];
}

function getExplicitEndpoint(points: Pt[], endpoint: 'start' | 'end'): Pt | null {
  if (!points.length) return null;
  return endpoint === 'start' ? points[0]! : points[points.length - 1]!;
}

export function localRouteToWaypoints(routePoints: Pt[]): Pt[] {
  const normalized = pipeSimplifyOrthogonal(routePoints);
  if (normalized.length <= 2) return [];
  return normalized.slice(1, -1);
}

export function worldRouteToLocalPoints(routePoints: Pt[], nodePosition: Pt): Pt[] {
  return normalizeLocalRoutePoints(worldToLocalPoints(routePoints, nodePosition));
}

export function worldRouteToLocalWaypoints(routePoints: Pt[], nodePosition: Pt): Pt[] {
  return localRouteToWaypoints(worldRouteToLocalPoints(routePoints, nodePosition));
}

export function fitWorldRouteToNodeBox(routePoints: Pt[], strokeWidth?: unknown) {
  const normalized = pipeSimplifyOrthogonal(routePoints.map((point) => ({ ...point })));
  if (normalized.length < 2) {
    return {
      position: { x: 0, y: 0 },
      size: { width: 1, height: 1 },
      points: normalized,
      waypoints: [],
    };
  }

  const padding = getPipeRoutePadding(strokeWidth);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const point of normalized) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  const position = { x: minX - padding, y: minY - padding };
  const size = {
    width: Math.max(1, maxX - minX + padding * 2),
    height: Math.max(1, maxY - minY + padding * 2),
  };
  const points = normalized.map((point) => ({
    x: point.x - position.x,
    y: point.y - position.y,
  }));

  return {
    position,
    size,
    points,
    waypoints: localRouteToWaypoints(points),
  };
}

export function movePipeSegment(
  routePoints: Pt[],
  segmentIndex: number,
  cursorWorld: Pt,
  options?: {
    sourceAnchor?: PipeAnchorType;
    targetAnchor?: PipeAnchorType;
  },
): Pt[] {
  if (!routePoints || routePoints.length < 2) return routePoints;

  const start = routePoints[0]!;
  const end = routePoints[routePoints.length - 1]!;
  const points = pipeSimplifyOrthogonal(routePoints.map((point) => ({ ...point })));
  const nextIndex = Math.min(points.length - 1, segmentIndex + 1);
  const a = points[segmentIndex]!;
  const b = points[nextIndex]!;
  const horizontal = pipeIsHorizontal(a, b);
  const corridor: PipeCorridorConstraint = horizontal
    ? { kind: 'horizontal', value: cursorWorld.y }
    : { kind: 'vertical', value: cursorWorld.x };

  return pipeSimplifyOrthogonal(
    pipeBuildShortestRoute(
      start,
      end,
      options?.sourceAnchor,
      options?.targetAnchor,
      corridor,
    ),
  );
}

export type PipeRouteContext = {
  /** zoom + pan offsets (same as VisualEngine / proxy-wrapper) */
  viewport: Viewport;
  /** Optional: Studio canvas root; falls back to #visual-engine-mount parent */
  containerEl?: HTMLElement | null;
};

/**
 * Returns pipe polyline in **node-local** coordinates (same as widget `update()` before SVG bbox).
 * Caller converts to world with `position + pt` per vertex.
 */
export function computeIndustrialPipeLocalRoute(
  props: Props,
  sizeIn: { width: number; height: number },
  widgetPosition: Pt,
  linkedNodes: Record<string, LinkedNodeInfo> | undefined,
  ctx: PipeRouteContext,
): Pt[] {
  const size = clampMinSize(sizeIn);
  const defaultEndpoints = buildDefaultLocalEndpoints(size);

  const sourceNode = props.sourceNodeId ? linkedNodes?.[props.sourceNodeId] : undefined;
  const targetNode = props.targetNodeId ? linkedNodes?.[props.targetNodeId] : undefined;

  const sourceDomNode =
    props.sourceNodeId && !sourceNode
      ? getPipeNodeWorldBoundsFromDom(props.sourceNodeId, ctx.viewport, ctx.containerEl)
      : undefined;
  const targetDomNode =
    props.targetNodeId && !targetNode
      ? getPipeNodeWorldBoundsFromDom(props.targetNodeId, ctx.viewport, ctx.containerEl)
      : undefined;

  const hasNodeBinding = !!(sourceNode || targetNode || sourceDomNode || targetDomNode);
  const explicitLocalPoints = normalizeLocalRoutePoints(props.points as Pt[] | undefined);
  const explicitWaypoints = localRouteToWaypoints(explicitLocalPoints);

  if (!hasNodeBinding && explicitLocalPoints.length >= 2) {
    if (
      explicitWaypoints.length === 0 &&
      isStraightFreeRoute(explicitLocalPoints) &&
      routeEscapesNodeBox(explicitLocalPoints, size)
    ) {
      return fitStraightFreeRouteToNodeBox(explicitLocalPoints, size);
    }
    return explicitLocalPoints;
  }

  let waypoints = props.waypoints;
  const hasStoredWaypoints = Array.isArray(props.waypoints) && props.waypoints.length > 0;
  if (!waypoints || waypoints.length === 0) {
    waypoints = explicitWaypoints.length > 0
      ? explicitWaypoints
      : migrateOldPoints(props.points as Pt[] | undefined);
  }

  let routePoints: Pt[];

  if (hasNodeBinding) {
    let startPt: Pt;
    if (props.sourcePortId && (sourceNode || sourceDomNode)) {
      const portWorld = getPortWorldPosition(
        props.sourceNodeId!,
        props.sourcePortId,
        ctx.viewport,
        ctx.containerEl,
      );
      if (portWorld) {
        startPt = worldToLocal(portWorld, widgetPosition);
      } else if (sourceNode) {
        startPt = worldToLocal(getTargetAnchorWorld(sourceNode as any, props.sourceAnchor ?? 'center'), widgetPosition);
      } else {
        startPt = worldToLocal(getAnchorPoint(sourceDomNode!, props.sourceAnchor ?? 'center'), widgetPosition);
      }
    } else if (sourceNode) {
      startPt = worldToLocal(getTargetAnchorWorld(sourceNode as any, props.sourceAnchor ?? 'center'), widgetPosition);
    } else if (sourceDomNode) {
      startPt = worldToLocal(getAnchorPoint(sourceDomNode, props.sourceAnchor as AnchorType), widgetPosition);
    } else if (explicitLocalPoints.length >= 2) {
      startPt = getExplicitEndpoint(explicitLocalPoints, 'start') ?? defaultEndpoints.start;
    } else {
      startPt = defaultEndpoints.start;
    }

    let endPt: Pt;
    if (props.targetPortId && (targetNode || targetDomNode)) {
      const portWorld = getPortWorldPosition(
        props.targetNodeId!,
        props.targetPortId,
        ctx.viewport,
        ctx.containerEl,
      );
      if (portWorld) {
        endPt = worldToLocal(portWorld, widgetPosition);
      } else if (targetNode) {
        endPt = worldToLocal(getTargetAnchorWorld(targetNode as any, props.targetAnchor ?? 'center'), widgetPosition);
      } else {
        endPt = worldToLocal(getAnchorPoint(targetDomNode!, props.targetAnchor ?? 'center'), widgetPosition);
      }
    } else if (targetNode) {
      endPt = worldToLocal(getTargetAnchorWorld(targetNode as any, props.targetAnchor ?? 'center'), widgetPosition);
    } else if (targetDomNode) {
      endPt = worldToLocal(getAnchorPoint(targetDomNode, props.targetAnchor as AnchorType), widgetPosition);
    } else if (explicitLocalPoints.length >= 2) {
      endPt = getExplicitEndpoint(explicitLocalPoints, 'end') ?? defaultEndpoints.end;
    } else {
      endPt = defaultEndpoints.end;
    }

    const shortestRoute = pipeBuildShortestRoute(
      startPt,
      endPt,
      props.sourceAnchor as PipeAnchorType,
      props.targetAnchor as PipeAnchorType,
    );
    const candidateRoute = pipeSimplifyOrthogonal(
      pipeBuildOrthogonalRoute(
        startPt,
        endPt,
        props.sourceAnchor as PipeAnchorType,
        props.targetAnchor as PipeAnchorType,
        waypoints,
      ),
    );

    routePoints =
      waypoints &&
      waypoints.length > 0 &&
      pipeShouldPreferShortestRoute(
        candidateRoute,
        shortestRoute,
        props.sourceAnchor as PipeAnchorType,
        props.targetAnchor as PipeAnchorType,
      )
        ? shortestRoute
        : candidateRoute;
  } else {
    routePoints = pipeSimplifyOrthogonal(
      pipeBuildOrthogonalRoute(
        defaultEndpoints.start,
        defaultEndpoints.end,
        props.sourceAnchor as PipeAnchorType,
        props.targetAnchor as PipeAnchorType,
        waypoints,
      ),
    );
  }

  const collapseFreeStart = !(sourceNode || sourceDomNode || props.sourcePortId);
  const collapseFreeEnd = !(targetNode || targetDomNode || props.targetPortId);
  return pipeCollapseFreeTerminalJog(routePoints, {
    collapseStart: collapseFreeStart && !hasStoredWaypoints,
    collapseEnd: collapseFreeEnd && !hasStoredWaypoints,
    threshold: Math.max(12, Number(props.strokeWidth ?? 12)),
  });
}

/** World-space polyline for Studio overlays — matches widget geometry. */
export function computeIndustrialPipeWorldPolyline(
  pipeNode: { schemaRef: any },
  nodesById: Record<string, any>,
  getViewport: () => Viewport,
  containerEl?: HTMLElement | null,
): Pt[] {
  const schema = pipeNode.schemaRef as any;
  const props = schema.props as Props;
  const lp = schema.position ?? { x: 0, y: 0 };
  const size = schema.size ?? { width: 200, height: 40 };

  const linkedNodes: Record<string, LinkedNodeInfo> = {};
  for (const id of Object.keys(nodesById)) {
    const n = nodesById[id]!;
    const s = n.schemaRef as any;
    if (!s?.position || !s?.size) continue;
    linkedNodes[id] = {
      id,
      position: s.position,
      size: s.size,
    };
  }

  const vp = getViewport();
  const local = computeIndustrialPipeLocalRoute(props, size, lp, linkedNodes, {
    viewport: { zoom: vp.zoom, offsetX: vp.offsetX, offsetY: vp.offsetY },
    containerEl,
  });
  return local.map((p) => ({ x: lp.x + p.x, y: lp.y + p.y }));
}
