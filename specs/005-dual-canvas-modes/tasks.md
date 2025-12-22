<!--
Tasks for Phase 2 (Implementation) and Phase 3 (Interaction & Transactions)
Each task is atomic and actionable. Assign owners/estimates as needed.
-->

## Phase 2 — Implementation (Canvas integration, Fixed & Infinite modes)

1. Add `CanvasView` props and type definitions
   - Action: Create/extend `apps/studio/src/components/CanvasView.tsx` props: `mode: 'fixed'|'infinite'`, `width`, `height`, `gridSize`, `snapToGrid`, `centeredMask`.
   - Outcome: Type-safe API for consumers; update `Editor` usage to pass config.
   - Estimate: 1d

2. Implement Fixed-mode rendering & centered mask
   - Action: In `CanvasView`, implement fixed drawing bounds using Leafer layer size tied to `width`/`height`, and render a centered mask overlay (non-interactive) showing the drawing region.
   - Outcome: Visual mask and clipped interaction region consistent with pixel-perfect large-screen previews.
   - Estimate: 1d

3. Implement Infinite-mode pan & zoom (Leafer integration)
   - Action: Integrate Leafer pan & zoom for Infinite mode; expose API hooks for programmatic pan/zoom (store actions).
   - Outcome: Smooth pan/zoom with bounded min/max scales; maintain `CanvasState` offsets/scale in store.
   - Estimate: 1.5d

4. Render grid background and snapping in Infinite mode
   - Action: Draw performant grid (dot/line based) at `gridSize` resolution in a Leafer background layer; implement snap-to-grid math for drag/drop and transform operations (configurable on/off).
   - Outcome: Visual grid + snapping behavior; integer-based math to avoid floating drift.
   - Estimate: 1d

5. Enforce package import rule in CI/lint
   - Action: Add an ESLint rule or repository scan that forbids imports matching `packages/thingsvis-ui/src/**` from `apps/*`; document fix pattern to use `@thingsvis/*`.
   - Outcome: CI prevents boundary-violating imports.
   - Estimate: 0.5d

6. Export `HeadlessErrorBoundary` from `packages/thingsvis-ui` (headless)
   - Action: Add `HeadlessErrorBoundary` component (no styles) in `packages/thingsvis-ui` and export it via package entry point.
   - Outcome: Reusable error wrapper for registry renderers.
   - Estimate: 0.5d

7. Add store hooks & subscriptions for Leafer rendering
   - Action: Add store selectors and a `VisualEngine` subscription that updates Leafer layers on store changes (minimize React re-renders).
   - Outcome: React bypass pattern followed; frame-critical updates happen outside React.
   - Estimate: 1.5d

8. Add basic DnD wiring (dragstart from materials → drop on Canvas)
   - Action: Implement dragstart metadata from material list; compute drop world coordinates in Canvas (accounting for scale/offset), and call `createNode` store action.
   - Outcome: Dropped components instantiate `NodeSchema` with generated id and default transform.
   - Estimate: 1d

9. Implement Node instantiation from `registry.json`
   - Action: Implement `createNode` action: look up `RegistryEntry`, validate `defaultProps` via Zod `PropsSchema`, assign uuid and default `transform`, insert into store.
   - Outcome: Stable instantiation with validation; errors surfaced to user via toast & HeadlessErrorBoundary for render failures.
   - Estimate: 1d

10. Add unit/integration tests for Canvas mode switching, grid rendering, and node instantiation
    - Action: Write tests that assert `CanvasState` transitions, `nodes` insertion, and grid rendering geometry math.
    - Outcome: CI-covered test cases preventing regressions.
    - Estimate: 1d

11. Documentation & quickstart updates
    - Action: Update `specs/005-dual-canvas-modes/quickstart.md` with any new dev commands and notes about import rules and testing.
    - Outcome: Developer onboarding for feature.
    - Estimate: 0.5d

## Phase 3 — Interaction, Command Pattern & Transactions (Undo/Redo)

12. Create `CmdStack` skeleton in `packages/thingsvis-kernel`
    - Action: Add `CmdStack` service with push/undo/redo, capacity default 50, serializable command records, and events for `onChange`.
    - Outcome: Kernel-level transaction manager for commands.
    - Estimate: 1d

13. Define `Command` interface and concrete commands
    - Action: Define `ICommand` (`do()`, `undo()`, `serialize()`), then implement `MoveCommand`, `ResizeCommand`, `RotateCommand`, `AddNodeCommand`, `RemoveNodeCommand`, `PropsUpdateCommand`.
    - Outcome: Encapsulated actions that mutate store when executed and revert when undone.
    - Estimate: 1.5d

14. Integrate Moveable for single-node transforms
    - Action: Add Moveable controls bound to the selected node DOM/Leafer element; on transform end, create/commit a Command to `CmdStack`.
    - Outcome: User can manipulate a node visually; transforms produce Commands for undo/redo.
    - Estimate: 1.5d

15. Integrate Selecto for multi-select & group operations
    - Action: Wire Selecto for marquee selection, shift/ctrl multi-select; allow group translation that produces one group Command or multiple Commands (decide grouping strategy).
    - Outcome: Multi-select UX with group move/resize producing Commands.
    - Estimate: 1.5d

16. Wire keyboard shortcuts & global UI hooks
    - Action: Add handlers for `Ctrl+Z` (undo) and `Ctrl+Shift+Z` (redo), and `Delete` for remove; ensure focus/textarea exceptions.
    - Outcome: Standard undo/redo UX.
    - Estimate: 0.5d

17. Implement optimistic update & rollback strategy for commands that may fail
    - Action: For commands that involve async operations (e.g., save to remote), implement optimistic apply with rollback on failure; ensure CmdStack state consistency.
    - Outcome: Robustness for networked operations.
    - Estimate: 1d

18. Performance guard: throttle/batch rapid transforms into composite commands
    - Action: When dragging continuously, buffer intermediate transforms and commit a single Command on end (or periodic coalescing), avoiding pushing hundreds of tiny Commands.
    - Outcome: Reduced CmdStack noise and better undo UX.
    - Estimate: 0.5d

19. Tests for CmdStack & Command objects
    - Action: Unit tests for push/undo/redo, capacity behavior, serialization, and composite command coalescing.
    - Outcome: Reliable transaction behavior.
    - Estimate: 1d

20. End-to-end test: Drag material → place → transform → undo/redo
    - Action: Create an e2e test (Playwright / testing-library) validating the primary workflow end-to-end.
    - Outcome: High-confidence integration test.
    - Estimate: 1.5d

## Acceptance Criteria (for release)

- Canvas supports `fixed` and `infinite` modes and switches without state corruption.  
- Grid rendering and snap-to-grid work in Infinite mode.  
- Dragging a material instantiates a validated `Node` in the store.  
- Moveable + Selecto integrations produce Commands recorded by `CmdStack`.  
- Undo/Redo works for at least 50 steps and common operations (move/resize/add/remove/props).  
- No direct imports into `packages/thingsvis-ui/src/` from `apps/*` (CI lint prevents).  
- All registry renderers are wrapped by `HeadlessErrorBoundary`.

## Notes / Open Decisions

- Grouping strategy for multi-select undo (one group command vs N per-node commands) — recommended: group-to-single-command for multi-node drags; record pre/post states.
- Serialization format for Commands — store minimal delta to reduce memory; include helpers to rehydrate.


