# Implementation Plan: Studio–Kernel Deep Integration

**Branch**: `005-studio-kernel-integration`
**Spec**: `spec.md`
**Created**: 2025-12-22

## Technical Context
- **Kernel Connection**: `apps/studio` creates `KernelStore` and shares it with `packages/thingsvis-ui/CanvasView`.
- **Rendering**: LeaferJS for 2D, R3F for 3D (via overlay).
- **Interaction**: `Moveable` for hybrid DOM/Canvas manipulation.
- **Distribution**: Module Federation 2.0 based on `registry.json`.

## Phase 0 — Research (done)
- See `research.md` for decisions on store connectivity, hybrid rendering, and interaction patterns.

## Phase 1 — Core Integration & Hybrid Rendering (P1)
Goals: Establish deep link between Kernel store and UI renderers.

Tasks:
1. **T1.1 Store Linkage**: Update `createKernelStore` to support full `PageSchema` and selection state.
2. **T1.2 Hybrid VisualEngine**: Extend `VisualEngine` to support 3D renderers via `R3F`.
3. **T1.3 Plugin Registry**: Implement `registry.json` fetch and plugin resolution logic in `apps/studio`.
4. **T1.4 Viewport Sync**: Ensure `CanvasView` viewport state (zoom/offset) is synced to Kernel store for global accessibility.

## Phase 2 — Interaction & Moveable Integration (P1)
Goals: Professional-grade editing interaction.

Tasks:
1. **T2.1 Moveable Adapter**: Implement real `Moveable` integration in `apps/studio`.
2. **T2.2 Proxy Sync**: Create a "Proxy Layer" in `CanvasView` that generates invisible DOM elements for canvas nodes to enable `Moveable` handles.
3. **T2.3 Command Dispatch**: Wire `Moveable` events (drag, scale, rotate) to dispatch Kernel commands (`moveCommand`, `transformCommand`).
4. **T2.4 Multi-selection**: Integrate `Selecto` for box-selection and sync with Kernel selection state.

## Phase 3 — Advanced Data Flow & Mode Support (P2)
Goals: Support Fixed/Infinite modes and complex schema updates.

Tasks:
1. **T3.1 Fixed Mode Boundaries**: Implement mask and centering logic for Fixed mode.
2. **T3.2 Infinite Mode Polish**: Smooth pan/zoom with grid snapping logic in `snapping.ts`.
3. **T3.3 Property Panel Sync**: Wire `apps/studio` property panel to `updateNode` action in Kernel store.

## Gates & Acceptance
- **Constitution Check**: All plugin executions must be wrapped in `SafeExecutor`.
- **Performance**: 1,000+ nodes maintain 60 FPS during pan/zoom.
- **Consistency**: Undo/Redo must restore project to 100% identical state.

