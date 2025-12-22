# Research: Kernel mount, renderer injection, dynamic loader, sandbox

**Feature**: Load registry components & left-panel DnD  
**Spec**: `spec.md`  
**Created**: 2025-12-22

## Unknowns & Decisions

### 1) How to initialize LeaferJS inside apps/studio viewport

Decision: Initialize a single Leafer `Viewport` instance inside `apps/studio` `CanvasView` container and expose a `VisualEngine` adapter in `packages/thingsvis-ui` to drive Leafer objects from kernel state.  
Rationale: Aligns with Constitution "React Bypass" — React renders container only; VisualEngine performs imperative updates for performance.

Alternatives:
- Create per-page Leafer instances (rejected — higher overhead).
- Use React-leafer wrapper for each node (rejected — violates bypass pattern).

### 2) Dynamic Loader strategy for registry.json entries

Decision: Use Module Federation (Rspack MF2) runtime loader for published plugins; fall back to a dynamic ESM fetch+eval loader for local fixtures during development. The loader resolves `remoteEntryUrl`, uses MF runtime to mount, and returns the exposed module entrypoint.

Rationale: Constitution mandates Rspack+MF2; MF runtime keeps bundle sizes manageable and matches existing plugin patterns.

Alternatives:
- Full eval-from-blob loader (dev-only).
- Bundled plugin registry at build-time (less flexible).

### 3) Sandbox (A1) containment model

Decision: Use Kernel `SafeExecutor` (logic sandbox) for plugin logic + UI `HeadlessErrorBoundary` for render containment. The dynamic loader must wrap evaluated plugin code in the SafeExecutor boundary prior to instantiation.

Rationale: Constitution v1.1.0 requires sandboxing; combined logic+visual boundaries ensure kernel and UI remain responsive.

### 4) Coordinate transforms across canvas modes

Decision: Implement a single coordinate helper `screenToCanvas(screenPoint, canvasConfig, viewportState)` supporting `fixed`, `infinite`, and `reflow` modes:
- `fixed`: screen -> centered viewport offset -> device pixels -> world coordinate (accounting for canvas width/height and DPR)
- `infinite`: screen -> apply pan offset and inverse zoom -> world units
- `reflow`: map relative container fractions to scaled canvas coordinates (flow layout aware)

Rationale: Deterministic helper centralizes math and is testable; acceptance tolerance ±1px.

Alternatives:
- Mode-specific ad-hoc transforms (harder to maintain).

### 5) Command Pattern integration

Decision: Every state-changing action (drop, move, resize, rotate) will create a Kernel `Command` object and call kernel.history.push(command, state). Each command implements `execute(state)` and `undo(state)`.

Rationale: Kernel already defines `HistoryManager` and Command types; reuse ensures consistent undo/redo across UI and headless consumers.

### Conclusion

We will implement: VisualEngine (Leafer adapter) + runtime dynamic loader (MF2 + dev fallback) + SafeExecutor wrapping + central coordinate helper + Command-based drops. These choices align with the constitution and enable testable acceptance criteria.

