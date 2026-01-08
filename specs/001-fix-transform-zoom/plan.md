# Implementation Plan: Fix Transform Coordinates Under Canvas Zoom

**Branch**: `001-fix-transform-zoom` | **Date**: 2026-01-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-fix-transform-zoom/spec.md`

## Summary

Fix incorrect node position/size commits when the canvas viewport is zoomed by making transform commits (dragEnd/resizeEnd) zoom-aware.

The editor renders Moveable targets as DOM “proxy” elements positioned in **world coordinates**, inside a wrapper that applies `translate(offsetX, offsetY) scale(zoom)`. Moveable interaction deltas are effectively in **screen pixels**, so committing them directly as world deltas corrupts stored data.

**Key Technical Decisions**:
1. **Single source of truth**: stored node geometry remains in world units (`position`, `size`).
2. **Commit-time conversion**: convert final Moveable deltas/sizes from screen-space to world-space using current viewport zoom at commit time.
3. **Viewport access**: pass a lightweight `getViewport()` callback from `CanvasView` to `TransformControls` (no kernel/schema changes).
4. **Stable base geometry**: use node geometry from kernel state as the base for commits (not `target.style.left/top`).

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.x, React 18.x  
**Primary Dependencies**:
- `moveable` (drag/resize handles)
- `selecto` (selection)
- `@thingsvis/ui` (`CanvasView` viewport + rendering)
- `@thingsvis/kernel` (`KernelStore` state/actions)

**Storage**: N/A (no new persistence layer; uses existing kernel state)  
**Testing**: Typecheck gate via `pnpm -w turbo run typecheck --filter=studio`; manual QA (interaction correctness)  
**Target Platform**: Modern browsers (Studio web app)  
**Project Type**: Web monorepo (apps + packages)  
**Performance Goals**: Maintain interactive editing responsiveness (no regressions; avoid heavy per-frame work)  
**Constraints**:
- Allowed to modify: `apps/studio`, `packages/thingsvis-ui`
- Do NOT modify: `packages/thingsvis-kernel`, `packages/thingsvis-schema`
- Must preserve undo/redo correctness (existing temporal/command stack behavior)

**Scale/Scope**: Single-user local editing; scenes may include many nodes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Micro-Kernel & Separation of Concerns | ✅ PASS | All work stays in `apps/studio` / view-layer wiring; no kernel UI coupling introduced |
| II. Schema-First Contracts (Zod) | ✅ PASS | No persisted schema changes required for this fix |
| III. Type Safety & Predictability | ✅ PASS | Keep strict TS; introduce typed `Viewport` shape for the new prop |
| IV. Backward Compatibility & Incremental Adoption | ✅ PASS | Existing projects remain compatible; only transform math changes |
| V. Simplicity & Performance | ✅ PASS | Commit-time conversion; minimal runtime overhead |
| VI. Plugin Independence & Third-Party Development | ✅ N/A | No plugin packaging or plugin imports affected |

**Pre-Design Gate**: ✅ All gates PASS  
**Post-Design Gate**: ✅ All gates PASS (re-evaluated after Phase 1 artifacts)

## Project Structure

### Documentation (this feature)

```text
specs/001-fix-transform-zoom/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── transform-controls.api.ts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
```text
apps/studio/src/components/
├── CanvasView.tsx                  # Renders UI CanvasView + proxy layer
└── tools/
    └── TransformControls.tsx       # Moveable/Selecto integration and commit logic

packages/thingsvis-ui/src/
├── components/CanvasView.tsx       # Emits viewport { zoom, offsetX, offsetY }
└── utils/coords.ts                 # Shared coord conversion helpers (reference)
```

**Structure Decision**: Web application structure. Fix is localized to `apps/studio` (wiring viewport zoom into transform commits). `packages/thingsvis-ui` is referenced for viewport semantics but does not require changes for this feature.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | - | - |
