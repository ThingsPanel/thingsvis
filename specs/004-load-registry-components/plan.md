# Implementation Plan: Load registry components & left-panel DnD

**Branch**: `004-load-registry-components`  
**Spec**: `spec.md`  
**Created**: 2025-12-22

## Phase 0 — Research (done)

- Decision: Leafer VisualEngine + Kernel SafeExecutor + MF2 dynamic loader (see `research.md`).

## Phase 1 — Kernel mount & render loop (L0 -> L2 injection) (P1)

Goals:
- Replace placeholder with real VisualEngine (Leafer) and wire kernel → visual sync.

Tasks:
1. T1.1 Initialize `VisualEngine` in `apps/studio/src/components/CanvasView.tsx` to create a Leafer `Viewport` and expose imperative APIs: `addNode`, `removeNode`, `updateNodeTransform`.
2. T1.2 Implement `packages/thingsvis-ui/visual/leaferAdapter.ts` that subscribes to kernel store and calls Leafer APIs (sync loop).
3. T1.3 Create dynamic loader module `packages/thingsvis-ui/loader/dynamicLoader.ts` implementing MF2 runtime and dev ESM fallback.
4. T1.4 Implement `screenToCanvas` helper in `packages/thingsvis-ui/utils/coords.ts` supporting `fixed`/`infinite`/`reflow`.
5. T1.5 Add Kernel Command `node.drop` implementation in `packages/thingsvis-kernel/commands/nodeDrop.ts` using Command interface and HistoryManager push.
6. T1.6 Integrate SafeExecutor wrapping in loader: loaded plugin module factories are executed under `SafeExecutor`.
7. T1.7 Add telemetry/logging hooks (`plugin.load.*` events) and tests.

Estimates: 6–10 dev days (split across T1.1–T1.7).

## Phase 2 — Dual-mode canvas & UX polish (P1)

Tasks:
1. T2.1 Implement Fixed mode centering + masked canvas and enforce width/height boundaries.
2. T2.2 Implement Infinite mode pan/zoom and grid background with snap-to-grid using `gridSize`.
3. T2.3 Reflow mode mapping and tests.
4. T2.4 Accessibility: keyboard insert and ARIA for DnD targets.

Estimates: 3–6 dev days.

## Phase 3 — Interaction & Transactions (P1)

Tasks:
1. T3.1 Integrate Moveable & Selecto in `apps/studio` with event adapters that dispatch Command objects.
2. T3.2 Implement Command objects for Move/Resize/Rotate and ensure HistoryManager handles 50+ steps.
3. T3.3 Performance profiling and React bypass checks (ensure VisualEngine updates not blocked by React tasks).

Estimates: 4–8 dev days.

## Phase 4 — DnD and Schema instantiation (P1)

Tasks:
1. T4.1 Implement left-panel DnD event wiring and drag ghost UX.
2. T4.2 On drop, compute world coords via `screenToCanvas`, construct NodeSchema, generate id, create `node.drop` command and dispatch to kernel.
3. T4.3 Ensure instantiated plugin instances are executed in SafeExecutor and wrapped in HeadlessErrorBoundary.
4. T4.4 Add unit/integration tests for Undo/Redo, coordinate accuracy, and sandbox A1 tests.

Estimates: 3–6 dev days.

## Gates & Acceptance

- Must pass Constitution checks: no styled headless components, kernel isolation, safe executor coverage.  
- Performance: canvas operations maintain ≥50 FPS in smoke tests.  
- Sandbox: misbehaving plugin test must not crash the app (A1).


