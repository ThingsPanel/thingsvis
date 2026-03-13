import type { StateCreator } from 'zustand/vanilla';
import type { KernelState, KernelActions, ConnectionState, NodeState } from '../types';

export type ConnectionSliceState = {
  connections: ConnectionState[];
};

export type ConnectionSliceActions = Pick<KernelActions, 'addConnection' | 'removeConnection'>;

export type ConnectionSlice = ConnectionSliceState & ConnectionSliceActions;

type Point = { x: number; y: number };
type Rect = { x: number; y: number; width: number; height: number };

function nodeRect(node: NodeState): Rect {
  const pos = node.schemaRef.position ?? { x: 0, y: 0 };
  const size = node.schemaRef.size ?? { width: 0, height: 0 };
  return {
    x: pos.x ?? 0,
    y: pos.y ?? 0,
    width: size.width ?? 0,
    height: size.height ?? 0,
  };
}

function rectCenter(r: Rect): Point {
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

function normalize(v: Point): Point {
  const d = Math.hypot(v.x, v.y);
  if (d <= 0) return { x: 1, y: 0 };
  return { x: v.x / d, y: v.y / d };
}

function borderPointFromCenter(rect: Rect, toward: Point): Point {
  // Compute intersection of ray from rect center toward `toward` with rect border.
  const c = rectCenter(rect);
  const d = { x: toward.x - c.x, y: toward.y - c.y };
  const dx = d.x;
  const dy = d.y;
  const hw = rect.width / 2;
  const hh = rect.height / 2;

  // If size is zero, treat as a point.
  if (hw <= 0 && hh <= 0) return c;

  // Scale factor to reach the border in the ray direction.
  const tx = Math.abs(dx) > 1e-6 ? hw / Math.abs(dx) : Number.POSITIVE_INFINITY;
  const ty = Math.abs(dy) > 1e-6 ? hh / Math.abs(dy) : Number.POSITIVE_INFINITY;
  const t = Math.min(tx, ty);
  if (!Number.isFinite(t)) return c;
  return { x: c.x + dx * t, y: c.y + dy * t };
}

function pathLength(points: Point[]): number {
  let sum = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    sum += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return sum;
}

function buildDefaultManhattanPolyline(source: NodeState, target: NodeState): Point[] {
  const sr = nodeRect(source);
  const tr = nodeRect(target);
  const sCenter = rectCenter(sr);
  const tCenter = rectCenter(tr);

  const dirST = normalize({ x: tCenter.x - sCenter.x, y: tCenter.y - sCenter.y });
  const dirTS = normalize({ x: sCenter.x - tCenter.x, y: sCenter.y - tCenter.y });

  const margin = 16;
  const sBorder = borderPointFromCenter(sr, tCenter);
  const tBorder = borderPointFromCenter(tr, sCenter);
  const sExit = { x: sBorder.x + dirST.x * margin, y: sBorder.y + dirST.y * margin };
  const tEntry = { x: tBorder.x + dirTS.x * margin, y: tBorder.y + dirTS.y * margin };

  const dx = Math.abs(tCenter.x - sCenter.x);
  const dy = Math.abs(tCenter.y - sCenter.y);
  if (dx < 4 || dy < 4) {
    // Almost aligned: keep it simple.
    return [sCenter, tCenter];
  }

  // Two candidates: horizontal-then-vertical (HV) or vertical-then-horizontal (VH)
  const bendHV: Point = { x: tEntry.x, y: sExit.y };
  const bendVH: Point = { x: sExit.x, y: tEntry.y };

  const hv = [sCenter, sExit, bendHV, tEntry, tCenter];
  const vh = [sCenter, sExit, bendVH, tEntry, tCenter];

  // Choose the shorter route by default (competitor-like behavior when no obstacles)
  return pathLength(hv) <= pathLength(vh) ? hv : vh;
}

export const createConnectionSlice: StateCreator<
  KernelState & KernelActions,
  [['zustand/immer', never]],
  [],
  ConnectionSlice
> = (set) => ({
  connections: [],

  addConnection: (conn) => {
    set((state) => {
      const source = state.nodesById[conn.sourceNodeId];
      const target = state.nodesById[conn.targetNodeId];

      const existingProps = (conn.props ?? {}) as Record<string, unknown>;
      const pathVal = existingProps['path'] as Record<string, unknown> | undefined;
      const hasPath =
        typeof pathVal === 'object' &&
        pathVal !== null &&
        pathVal['kind'] === 'polyline' &&
        Array.isArray(pathVal['points']);

      let nextProps: Record<string, unknown> = existingProps;
      if (!hasPath && source && target) {
        const points = buildDefaultManhattanPolyline(source, target);
        nextProps = {
          direction: (existingProps['direction'] as string) ?? 'forward',
          ...existingProps,
          path: {
            kind: 'polyline',
            points,
          },
        };
      }

      state.connections.push({
        ...conn,
        id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        props: nextProps,
      });
    });
  },

  removeConnection: (connId) => {
    set((state) => {
      state.connections = state.connections.filter((c) => c.id !== connId);
    });
  },
});
