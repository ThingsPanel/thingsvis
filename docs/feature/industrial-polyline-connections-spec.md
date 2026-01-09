# Feature Spec: Industrial Polyline Connections (Pipes/Wires)

**Goal**: Provide industrial-topology-grade connections that support arbitrary direction, polyline geometry, arrow direction, and flow animation (speed can bind to runtime data sources).

## Status Update (Current Repo Direction)

This repository now implements “lines” as **normal components** (a plugin) instead of a special kernel-level “node-to-node connection” feature.

- Default “click two nodes to connect” tool is removed from Studio UI.
- The recommended implementation is the plugin component `basic/line` (SVG overlay), which supports:
  - polyline points
  - arrow direction
  - flow animation (renderer-local rAF)
  - style editing via the normal Props panel
- Studio toolbar exposes a competitor-style **line preset panel** (straight / polyline / curve / mind-map curve + arrow direction) and creates `basic/line` nodes with preset props.

This spec is designed to fit the current architecture:
- State in `@thingsvis/kernel` (zustand+immer+zundo)
- Rendering in `@thingsvis/ui` via Leafer (`VisualEngine`)
- Studio interaction via proxy layer DOM targets

---

## 1. Background (Current Implementation)

Legacy MVP connection implementation (now deprecated/off by default):
- Create a connection by clicking two nodes (no ports, no dragging).
- Render as a center-to-center straight `Line` in Leafer.

Relevant implementations:
- Legacy connection creation tool: `apps/studio/src/components/tools/ConnectionTool.tsx` (no longer mounted)
- Connection state: `packages/thingsvis-kernel/src/store/KernelStore.ts` (`ConnectionState`)
- Connection rendering: `packages/thingsvis-ui/src/engine/VisualEngine.ts` (`syncConnections()`)

Current implementation (recommended):
- Line component plugin: `plugins/basic/line`
- Studio creation tool spec: `apps/studio/src/components/tools/types.ts` (`line` -> `basic/line`)
- Studio toolbar preset panel: `apps/studio/src/components/Editor.tsx`

---

## 2. Non-goals (for this iteration)

To keep scope controllable, the following are explicitly out-of-scope unless later requested:
- Automatic obstacle avoidance routing
- Full edge editing UI (vertex drag/insert/delete) — can be Phase 2
- Edge grouping/layout algorithms
- Complex electrical simulation / fluid dynamics simulation

---

## 3. Requirements

### 3.1 Functional Requirements

**FR-001 Polyline geometry**
- A connection MUST be able to store a polyline path in world coordinates.
- A polyline MUST support multiple segments (multiple vertices).

**FR-002 Stable attachment to nodes**
- Connection endpoints MUST remain attached to the correct node during node move/resize/zoom/pan.

**FR-003 Direction & arrow**
- A connection MUST support direction modes:
  - `forward` (source -> target)
  - `reverse` (target -> source)
  - `bidirectional`
- The renderer MUST show arrow indicator(s) according to direction.

**FR-004 Flow animation**
- A connection MAY enable flow animation.
- Flow animation MUST move markers along the polyline.
- Flow speed MUST support binding to runtime data sources (expression or resolved value).
- Flow animation MUST NOT write per-frame updates into the kernel store (avoid undo/redo pollution).

**FR-005 Style**
- Connection MUST support stroke, width, dash pattern (optional), opacity.

### 3.2 Performance Requirements

**PR-001 No-store-per-frame**
- Animation MUST be driven by renderer-local rAF/ticker and cached runtime values.

**PR-002 Update cost**
- When nodes move, connections update endpoints and re-sample paths efficiently.

---

## 4. Data Model

### 4.1 Kernel `ConnectionState` (Recommended Extension)

Keep current `ConnectionState` but standardize `props`.

```ts
export type ConnectionDirection = 'forward' | 'reverse' | 'bidirectional';

export type ConnectionPath = {
  kind: 'polyline';
  // world coordinates
  points: Array<{ x: number; y: number }>;
};

export type ConnectionStyle = {
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  dashPattern?: number[]; // optional
};

export type ConnectionFlow = {
  enabled?: boolean;
  // either number or expression string resolved by PropertyResolver-like logic
  speed?: number | string;
  spacing?: number;     // distance between markers
  markerSize?: number;  // marker size in px
};

export type ConnectionProps = {
  path?: ConnectionPath;
  direction?: ConnectionDirection;
  style?: ConnectionStyle;
  flow?: ConnectionFlow;
  // reserved: medium/type/metadata
  medium?: 'water' | 'steam' | 'electric' | 'gas' | 'custom';
  meta?: Record<string, unknown>;
};

export type ConnectionState = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  // use as portId for endpoints (optional for v1)
  sourceAnchor?: string;
  targetAnchor?: string;
  props?: ConnectionProps;
};
```

### 4.2 Ports (Anchor/Port) Model

Ports are needed for stable endpoints and for consistent arrow/flow direction.

Recommended approach:
- `sourceAnchor/targetAnchor` store `portId`.
- Each node type can define ports in plugin metadata.
- Fallback: auto-generate 4 default ports if not provided.

Port definition (conceptual):
```ts
export type PortDef = {
  id: string;
  // relative within node bbox
  x: number; // 0..1
  y: number; // 0..1
  // optional direction hint for arrow tangent
  normal?: { x: number; y: number };
};
```

---

## 5. Rendering Architecture (Recommended)

### 5.1 Visual primitives

Render a connection as 2 (or 3) Leafer layers:
1) `line`: polyline path
2) `arrow`: marker(s) at endpoints (triangles)
3) `flowMarkers` (optional): repeated markers moving along the path

### 5.2 Polyline sampling

To animate markers along a polyline:
- Precompute segment lengths and a cumulative-length table for each connection.
- On each frame, compute marker positions by arc-length:
  - totalLength = sum(segmentLengths)
  - offset = (time * speed) % totalLength
  - for i in markers: s = (offset + i * spacing) % totalLength
  - map arc-length `s` -> point on segment

IMPORTANT:
- Store computed sampling cache in `VisualEngine` (not in kernel store).
- Recompute sampling cache only when path points/endpoints change.

### 5.3 Animation loop

Use renderer-local rAF:
- Start rAF only if at least one connection has `flow.enabled`.
- Each frame updates only Leafer objects' x/y/rotation.

A shared render-loop exists in `packages/thingsvis-ui/src/visual-engine/render-loop.ts`; `VisualEngine` may either:
- implement its own rAF, or
- reuse this loop if it integrates well with store-patch subscriptions.

---

## 6. Interaction Design (Studio)

### 6.1 Minimal Phase-1 interaction

To achieve industrial usability quickly:
- Keep the existing click-to-connect flow for MVP compatibility.
- When creating a connection, set a default polyline path:
  - competitor-style default: Manhattan polyline with one bend (HV or VH)
    - generate exit point outside the source node bbox
    - generate entry point outside the target node bbox
    - pick HV vs VH by shorter total path length (no obstacle avoidance in Phase 1)

### 6.2 Phase-2 (Recommended) interaction

- Drag from a port handle to another port handle.
- Show a draft polyline during dragging.
- Snap to nearest port within threshold.
- Commit connection on pointerup.

NOTE:
- Draft rendering should not mutate kernel store.

---

## 7. Step-by-step Implementation Plan

### Phase 1 — Polyline + Arrow + Flow (no advanced editing)

1) Kernel: standardize `ConnectionState.props` shape (types only; keep backward compatibility).
2) Kernel: on `addConnection`, if `props.path` absent, generate default path.
3) UI: update `VisualEngine.syncConnections()` to:
   - compute endpoint points (center or port-based fallback)
   - render polyline using Leafer
   - render arrow markers based on direction
4) UI: implement flow marker animation loop (renderer-local rAF) using sampling cache.

Acceptance:
- Create a connection; it is polyline.
- Toggle direction; arrow updates.
- Enable flow; markers move along the line.

### Phase 2 — Ports + Drag connect + Reconnect

1) Add ports metadata for nodes (plugin-level), fallback to 4 default ports.
2) Studio: render port handles in proxy layer and implement drag-to-connect.
3) Store `sourceAnchor/targetAnchor` portIds.
4) Support reconnect endpoint by dragging arrow/endpoint.

Acceptance:
- Endpoints stay attached to correct port during move/resize.
- Drag connect works, with snapping.

### Phase 3 — Vertex editing + Optional routing

1) Add vertex editing handles on selected connection.
2) Insert/delete/move vertices.
3) Optional: orthogonal routing helpers.

---

## 8. Compatibility & Migration

- Existing connections without `props.path` will render as a 2-point polyline derived from endpoints.
- Existing connections without direction default to `forward`.
- Existing code paths should continue to work without requiring plugin changes.

---

## 9. Risks & Mitigations

- **Risk: animation performance** with many connections
  - Mitigation: only animate connections with `flow.enabled`; batch updates; reuse marker objects.

- **Risk: store churn** if flow speed updates frequently
  - Mitigation: resolve speed into renderer cache; update cache only on datasource changes (not per frame).

- **Risk: missing port metadata**
  - Mitigation: generate default ports and allow center fallback.
