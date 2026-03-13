import type { KernelStore, NodeState, ConnectionState } from '@thingsvis/kernel';
import { Group, Line } from 'leafer-ui';
import { ExpressionEvaluator } from '@thingsvis/utils';

type Point = { x: number; y: number };
type ConnectionDirection = 'forward' | 'reverse' | 'bidirectional';

type ConnectionPathCache = {
    points: Point[];
    segLen: number[];
    cumLen: number[]; // cumLen[0]=0, cumLen[i] = length up to segment i-1
    total: number;
};

export class ConnectionManager {
    private connRoot?: Group;
    private connectionMap = new Map<string, Line>();
    private connectionArrowMap = new Map<string, { a: Line; b: Line }>();
    private connectionFlowMap = new Map<string, Line[]>();
    private connectionPathCache = new Map<string, ConnectionPathCache>();
    private connectionFlowSpeedCache = new Map<string, number>();
    private flowRafId: number | null = null;

    constructor(private store: KernelStore, private rootGroup: Group) { }

    mount() {
        this.connRoot = new Group();
        this.rootGroup.addAt(this.connRoot, 0); // At bottom, below nodes
    }

    unmount() {
        this.connectionMap.clear();
        for (const { a, b } of this.connectionArrowMap.values()) {
            a.remove();
            b.remove();
        }
        this.connectionArrowMap.clear();
        for (const markers of this.connectionFlowMap.values()) {
            markers.forEach(m => m.remove());
        }
        this.connectionFlowMap.clear();
        this.connectionPathCache.clear();
        this.connectionFlowSpeedCache.clear();
        if (this.flowRafId != null) cancelAnimationFrame(this.flowRafId);
        this.flowRafId = null;
        this.connRoot?.remove();
        this.connRoot = undefined;
    }

    sync(nodes: Record<string, NodeState>, connections: ConnectionState[]) {
        if (!this.connRoot) return;

        const currentConnIds = new Set(connections.map(c => c.id));

        // Remove old connections
        for (const [id, line] of Array.from(this.connectionMap.entries())) {
            if (!currentConnIds.has(id)) {
                line.remove();
                this.connectionMap.delete(id);

                const arrows = this.connectionArrowMap.get(id);
                if (arrows) {
                    arrows.a.remove();
                    arrows.b.remove();
                    this.connectionArrowMap.delete(id);
                }

                const markers = this.connectionFlowMap.get(id);
                if (markers) {
                    markers.forEach(m => m.remove());
                    this.connectionFlowMap.delete(id);
                }
                this.connectionPathCache.delete(id);
                this.connectionFlowSpeedCache.delete(id);
            }
        }

        // Add or update connections
        let hasAnyFlow = false;
        connections.forEach(conn => {
            const source = nodes[conn.sourceNodeId];
            const target = nodes[conn.targetNodeId];
            if (!source || !target) return;

            const sp = source.schemaRef.position;
            const ss = (source.schemaRef as any).size ?? { width: 0, height: 0 };
            const tp = target.schemaRef.position;
            const ts = (target.schemaRef as any).size ?? { width: 0, height: 0 };

            // Endpoints
            const p1: Point = { x: sp.x + ss.width / 2, y: sp.y + ss.height / 2 };
            const p2: Point = { x: tp.x + ts.width / 2, y: tp.y + ts.height / 2 };

            const style = (conn.props as any)?.style ?? {};
            const stroke = (style.stroke as string) ?? ((conn.props as any)?.stroke as string) ?? '#6965db';
            const strokeWidth = (style.strokeWidth as number) ?? ((conn.props as any)?.strokeWidth as number) ?? 2;
            const opacity = (style.opacity as number) ?? 0.6;
            const dashPattern = (style.dashPattern as number[] | undefined) ?? ((conn.props as any)?.dashPattern as number[] | undefined);

            const rawPath = (conn.props as any)?.path;
            let points: Point[] = [];
            if (rawPath && rawPath.kind === 'polyline' && Array.isArray(rawPath.points)) {
                points = rawPath.points
                    .filter((pt: any) => pt && typeof pt.x === 'number' && typeof pt.y === 'number')
                    .map((pt: any) => ({ x: pt.x, y: pt.y }));
            }
            if (points.length < 2) {
                points = [p1, p2];
            }
            points[0] = p1;
            points[points.length - 1] = p2;

            const flatPoints: number[] = [];
            for (const pt of points) {
                flatPoints.push(pt.x, pt.y);
            }

            let line = this.connectionMap.get(conn.id);
            if (!line) {
                line = new Line({
                    points: flatPoints,
                    stroke,
                    strokeWidth,
                    opacity,
                    ...(dashPattern ? { dashPattern } : {})
                });
                this.connRoot!.add(line);
                this.connectionMap.set(conn.id, line);
            } else {
                line.set({
                    points: flatPoints,
                    stroke,
                    strokeWidth,
                    opacity,
                    ...(dashPattern ? { dashPattern } : { dashPattern: undefined as any })
                });
            }

            this.connectionPathCache.set(conn.id, this.buildPathCache(points));

            const direction = ((conn.props as any)?.direction as ConnectionDirection) ?? 'forward';
            this.syncConnectionArrows(conn.id, points, { stroke, strokeWidth, opacity }, direction);

            const flow = (conn.props as any)?.flow;
            const flowEnabled = !!flow?.enabled;
            if (flowEnabled) {
                hasAnyFlow = true;
                const speed = this.resolveFlowSpeed(flow?.speed);
                this.connectionFlowSpeedCache.set(conn.id, speed);
                this.syncConnectionFlowMarkers(conn.id, points, { stroke, strokeWidth, opacity }, flow);
            } else {
                const existing = this.connectionFlowMap.get(conn.id);
                if (existing) {
                    existing.forEach(m => m.remove());
                    this.connectionFlowMap.delete(conn.id);
                }
                this.connectionFlowSpeedCache.delete(conn.id);
            }
        });

        if (hasAnyFlow) {
            this.startFlowLoop();
        } else {
            this.stopFlowLoop();
        }
    }

    private resolveFlowSpeed(input: unknown): number {
        if (typeof input === 'number' && Number.isFinite(input)) return input;
        if (typeof input === 'string') {
            if (input.includes('{{')) {
                try {
                    const state = this.store.getState() as any;
                    const resolved = ExpressionEvaluator.evaluate(input, { ds: state.dataSources });
                    const n = typeof resolved === 'number' ? resolved : Number(resolved);
                    return Number.isFinite(n) ? n : 0;
                } catch { /* expression evaluation failed — default to 0 */
                    return 0;
                }
            }
            const n = Number(input);
            return Number.isFinite(n) ? n : 0;
        }
        return 0;
    }

    private buildPathCache(points: Point[]): ConnectionPathCache {
        const segLen: number[] = [];
        const cumLen: number[] = [0];
        let total = 0;
        for (let i = 0; i < points.length - 1; i++) {
            const a = points[i];
            const b = points[i + 1];
            if (!a || !b) continue;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy);
            segLen.push(len);
            total += len;
            cumLen.push(total);
        }
        return { points, segLen, cumLen, total };
    }

    private samplePath(cache: ConnectionPathCache, s: number): { p: Point; dir: Point } {
        const { points, segLen, cumLen, total } = cache;
        if (points.length < 2 || total <= 0) {
            return { p: points[0] ?? { x: 0, y: 0 }, dir: { x: 1, y: 0 } };
        }
        let dist = s;
        if (dist < 0) dist = 0;
        if (dist > total) dist = total;
        let i = 0;
        while (i < segLen.length - 1 && (cumLen[i + 1] ?? total) < dist) i++;
        const a = points[i]!;
        const b = points[i + 1]!;
        const len = segLen[i] ?? 0;
        const base = cumLen[i] ?? 0;
        const t = len <= 0 ? 0 : (dist - base) / len;
        const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const dir = { x: dx / d, y: dy / d };
        return { p, dir };
    }

    private rotate(v: Point, rad: number): Point {
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
    }

    private syncConnectionArrows(
        id: string,
        points: Point[],
        style: { stroke: string; strokeWidth: number; opacity: number },
        direction: ConnectionDirection
    ) {
        if (!this.connRoot) return;
        const wantStart = direction === 'reverse' || direction === 'bidirectional';
        const wantEnd = direction === 'forward' || direction === 'bidirectional';

        let arrows = this.connectionArrowMap.get(id);
        if (!arrows) {
            arrows = {
                a: new Line({ points: [0, 0, 0, 0], stroke: style.stroke, strokeWidth: Math.max(1, style.strokeWidth), opacity: 0 }),
                b: new Line({ points: [0, 0, 0, 0], stroke: style.stroke, strokeWidth: Math.max(1, style.strokeWidth), opacity: 0 })
            };
            this.connRoot.add(arrows.a);
            this.connRoot.add(arrows.b);
            this.connectionArrowMap.set(id, arrows);
        }

        const updateArrowAt = (tip: Point, dir: Point, visible: boolean) => {
            const len = Math.max(8, style.strokeWidth * 4);
            const phi = Math.PI / 6;
            const back = { x: -dir.x, y: -dir.y };
            const v1 = this.rotate(back, phi);
            const v2 = this.rotate(back, -phi);
            const p1 = { x: tip.x + v1.x * len, y: tip.y + v1.y * len };
            const p2 = { x: tip.x + v2.x * len, y: tip.y + v2.y * len };
            arrows!.a.set({ points: [tip.x, tip.y, p1.x, p1.y], stroke: style.stroke, strokeWidth: Math.max(1, style.strokeWidth), opacity: visible ? style.opacity : 0 });
            arrows!.b.set({ points: [tip.x, tip.y, p2.x, p2.y], stroke: style.stroke, strokeWidth: Math.max(1, style.strokeWidth), opacity: visible ? style.opacity : 0 });
        };

        if (wantEnd && points.length >= 2) {
            const tip = points[points.length - 1]!;
            const prev = points[points.length - 2]!;
            const d = Math.hypot(tip.x - prev.x, tip.y - prev.y) || 1;
            const dir = { x: (tip.x - prev.x) / d, y: (tip.y - prev.y) / d };
            updateArrowAt(tip, dir, true);
        } else if (wantStart && points.length >= 2) {
            const tip = points[0]!;
            const next = points[1]!;
            const d = Math.hypot(tip.x - next.x, tip.y - next.y) || 1;
            const dir = { x: (tip.x - next.x) / d, y: (tip.y - next.y) / d };
            updateArrowAt(tip, dir, true);
        } else {
            arrows.a.set({ opacity: 0 });
            arrows.b.set({ opacity: 0 });
        }
    }

    private syncConnectionFlowMarkers(
        id: string,
        points: Point[],
        style: { stroke: string; strokeWidth: number; opacity: number },
        flow: any
    ) {
        if (!this.connRoot) return;
        const cache = this.connectionPathCache.get(id) ?? this.buildPathCache(points);
        this.connectionPathCache.set(id, cache);
        const total = cache.total;
        if (total <= 0) return;

        const spacing = typeof flow?.spacing === 'number' && flow.spacing > 0 ? flow.spacing : 24;
        const markerSize = typeof flow?.markerSize === 'number' && flow.markerSize > 0 ? flow.markerSize : 10;

        const count = Math.min(40, Math.max(1, Math.floor(total / spacing)));
        let markers = this.connectionFlowMap.get(id);
        if (!markers) {
            markers = [];
            this.connectionFlowMap.set(id, markers);
        }
        while (markers.length < count) {
            const m = new Line({
                points: [0, 0, 0, 0],
                stroke: style.stroke,
                strokeWidth: Math.max(1, style.strokeWidth),
                opacity: style.opacity
            });
            this.connRoot.add(m);
            markers.push(m);
        }
        while (markers.length > count) {
            const m = markers.pop();
            m?.remove();
        }
        (markers as any).__thingsvis_flow_spacing__ = spacing;
        (markers as any).__thingsvis_flow_markerSize__ = markerSize;
    }

    private startFlowLoop() {
        if (this.flowRafId != null) return;
        const start = performance.now();
        const tick = (now: number) => {
            const t = (now - start) / 1000;
            this.updateFlowFrame(t);
            this.flowRafId = requestAnimationFrame(tick);
        };
        this.flowRafId = requestAnimationFrame(tick);
    }

    private stopFlowLoop() {
        if (this.flowRafId == null) return;
        cancelAnimationFrame(this.flowRafId);
        this.flowRafId = null;
    }

    private updateFlowFrame(tSec: number) {
        for (const [id, markers] of this.connectionFlowMap.entries()) {
            const cache = this.connectionPathCache.get(id);
            if (!cache || cache.total <= 0) continue;
            const speed = this.connectionFlowSpeedCache.get(id) ?? 0;
            if (!Number.isFinite(speed) || speed === 0) continue;

            const spacing = (markers as any).__thingsvis_flow_spacing__ ?? 24;
            const markerSize = (markers as any).__thingsvis_flow_markerSize__ ?? 10;
            const total = cache.total;
            const base = ((tSec * speed) % total + total) % total;

            for (let i = 0; i < markers.length; i++) {
                const s = (base + i * spacing) % total;
                const { p, dir } = this.samplePath(cache, s);
                const dx = dir.x;
                const dy = dir.y;
                const x1 = p.x - dx * (markerSize / 2);
                const y1 = p.y - dy * (markerSize / 2);
                const x2 = p.x + dx * (markerSize / 2);
                const y2 = p.y + dy * (markerSize / 2);
                markers[i]!.set({ points: [x1, y1, x2, y2] });
            }
        }
    }
}
