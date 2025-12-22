# Implementation Plan: Dual Canvas Modes (Fixed & Infinite)

**Branch**: `[005-dual-canvas-modes]` | **Date**: 2025-12-22 | **Spec**: `specs/005-dual-canvas-modes/spec.md`

## Summary

实现 Editor 的双模式画布（Fixed - 大屏 & Infinite - 组态），并改进 Editor 引入组件的方式以遵守包引用约束（禁止使用 `packages/thingsvis-ui/src/...`，必须通过 `@thingsvis` 导入）。同时引入交互能力（选择、移动、缩放、旋转、撤销/重做）和从物料库拖入组件的完整流程，确保性能及错误隔离。

## Technical Context

- **Language/Version**: TypeScript (TS 5.x, strict)  
- **Primary Dependencies**: React, LeaferJS (`leafer-ui`), Moveable, Selecto, Zustand, Immer, Zod, Rspack (build), pnpm workspace.  
- **Target Platform**: Web - `apps/studio` (editor), `apps/preview` (runtime preview).  
- **Performance Goals**: Editor surfaces must target ≥50 FPS when interacting with typical scenes (up to ~500 nodes).  
- **Constraints**: Core logic (stores, CmdStack, schemas) lives in `packages/thingsvis-kernel`/`packages/thingsvis-schema`. UI components must be headless in `packages/thingsvis-ui`. All third-party renderer code must be sandboxed in an ErrorBoundary wrapper.

## Constitution Check

GATE: Must satisfy the ThingsVis Constitution (Headless UI, Kernel isolation, React Bypass).

- Imports: No relative imports into `packages/thingsvis-ui/src/...`; use `@thingsvis/*` package entry points.  
- Error isolation: All user-loaded or registry-provided components are rendered inside `HeadlessErrorBoundary`.  
- Rendering: Use React only for container + `CanvasView`; visual updates routed to Leafer instances via store subscription.

## Project Structure (feature)

```
specs/005-dual-canvas-modes/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── openapi.yaml
```

## Phases (short)

- Phase 0: Research & decisions (this artifact set)  
- Phase 1: Data model, API contracts, quickstart (generated)  
- Phase 2: Implementation tasks (split into tasks.md via speckit.tasks)

## Complexity Tracking

No constitution violations expected. If a deviation is required (e.g., temporary DOM access for legacy charts), document in Complexity Tracking with justification.


