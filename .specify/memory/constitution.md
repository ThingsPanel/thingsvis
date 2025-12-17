<!--
Sync Impact Report
- Version change: N/A → 1.0.0
- Modified principles: new constitution
- Added sections: Architecture & Technology Constraints; Development Workflow & Quality Gates
- Removed sections: none
- Templates requiring updates: ✅ .specify/templates/plan-template.md | ✅ .specify/templates/spec-template.md | ✅ .specify/templates/tasks-template.md | ⚠️ commands templates (not present)
- Follow-up TODOs: TODO(RATIFICATION_DATE): original adoption date not provided

Sync Impact Report
- Version change: N/A → 1.1.0
- Modified principles: 强调了ui组件必须是无样式文件，组件必须沙盒封装
- Date: 2025/12/16
-->

# ThingsVis Constitution

## Core Principles

### I. Monorepo & Workspace Discipline
ThingsVis MUST operate as a pnpm workspace monorepo orchestrated by Turborepo.
- `packages/thingsvis-kernel`: Pure logic (Store, EventBus). **NO React/DOM dependencies.**
- `packages/thingsvis-ui`: Headless visual adapters. **NO default styles/CSS.**
- `packages/thingsvis-schema`: Pure data types (Zod). **Dependency Level 0.**
- `apps/*` & `plugins/*`: The implementation layer where styles (Tailwind) are applied.
Rationale: Strict separation of concerns allows the engine to run in diverse environments (e.g., Web Workers, Server-side).

### II. Micro-Kernel Isolation
The kernel (L0) is the "Brain". It owns lifecycle, messaging, and the **Logic Sandbox** (SafeExecutor). It MUST NOT depend on plugins (L1) or the editor (L2). Plugins integrate only through published contracts. Rationale: Preserves extensibility and prevents "God Object" kernels.

### III. Stack Mandates & Type Safety
Rspack with Module Federation 2.0 is mandatory for builds. TypeScript 5.x runs in strict mode. Runtime validation uses Zod in `packages/thingsvis-schema` as the single source of truth.

### IV. Rendering & State Pipeline (React Bypass)
Rendering MUST follow the "React Bypass" pattern for performance:
1.  **State**: Zustand + Immer (Vanilla store in Kernel).
2.  **Sync**: `VisualEngine` (in UI package) subscribes to Store and updates LeaferJS/ThreeJS instances directly.
3.  **React**: Only renders the container `div` and the `CanvasView` wrapper. React Re-renders are minimized.
Rationale: Supporting 1000+ nodes at 60FPS requires bypassing React's reconciliation for every frame.

### V. Sandbox Strategy & UI Discipline
- **Logic Sandbox**: The Kernel MUST implement a `SafeExecutor` to catch JS errors in user logic/plugins without crashing the main thread.
- **Visual Sandbox**: The UI package MUST provide a `<HeadlessErrorBoundary>` that accepts a `fallback` prop but applies **NO styles** itself.
- **Styling Rule**: `packages/thingsvis-ui` components must be unstyled (Headless). `apps/*` and `plugins/*` MUST use TailwindCSS + `shadcn/ui`.
Rationale: Resilient operator experiences; Kernel stability does not depend on UI correctness.

## Architecture & Technology Constraints

- **Build**: Rspack + Module Federation 2.0.
- **Data Truth**: All shared shapes, events, and configuration types live in `packages/thingsvis-schema`.
- **Rendering**: 2D via `leafer-ui`; 3D via `react-three-fiber`.
- **State**: Centralized stores with zustand/immer; mutations go through typed actions.
- **Performance**: Core bundle <800KB. Target ≥50 FPS.

## Development Workflow & Quality Gates

- **Spec-driven**: Define `NodeSchema` in Zod before implementing Renderers.
- **Headless Check**: PRs to `thingsvis-ui` MUST be rejected if they contain CSS/Tailwind classes.
- **Sandbox Check**: New features must demonstrate they do not crash the app when they fail (try-catch or ErrorBoundary).
- **Code Comments**: Critical logic, complex algorithms, and necessary code locations MUST include Chinese comments
- **Testing**: Contract tests for kernel ↔ plugin interfaces.

## Governance

- This constitution supersedes conflicting guidelines.
- **Compliance**: Code reviews block on violations of the "Headless UI" or "React Bypass" rules unless explicitly justified.
- **Versioning**: v1.1.0 introduces strict Sandbox & Headless separation.

**Version**: 1.1.0 | **Ratified**: 2025-12-15 | **Last Amended**: 2025-12-15
