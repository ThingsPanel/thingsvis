# Implementation Plan: Phase 2 - L0 Kernel Engine

**Branch**: `002-l0-kernel-engine` | **Date**: 2025-12-16 | **Spec**: [specs/002-l0-kernel-engine/spec.md](./spec.md)  
**Input**: Feature specification from `/specs/002-l0-kernel-engine/spec.md`

## Summary

Implement the L0 Kernel Engine as a headless rendering and state-management runtime that takes validated ThingsVis page schemas and renders them using LeaferJS via a React Bypass pattern. The implementation introduces strict package boundaries: `@thingsvis/schema` (Zod definitions), `@thingsvis/utils` (helper functions), `@thingsvis/kernel` (vanilla Zustand store, HistoryManager, SafeExecutor, EventBus, ResourceLoader), and `@thingsvis/ui` (VisualEngine with LeaferJS, CanvasView React wrapper, HeadlessErrorBoundary). All packages use Rspack (library mode for packages, app mode for preview), maintain strict TypeScript 5.x typing, and follow the React Bypass pattern for high-performance rendering of 1000+ nodes. The demo app in `apps/preview` validates the engine with performance benchmarks.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: 
- `zod` (schema validation)
- `zustand` + `immer` (state management, vanilla usage in kernel)
- `leafer-ui` (2D rendering engine)
- `react` + `react-dom` (React 18, only in UI package and apps)
- `@rspack/core` (build tool, used consistently for libraries and apps)

**Storage**: N/A (in-memory state only; no persistence in this phase)  
**Testing**: TypeScript strict type-checking; manual validation via demo app; optional contract/unit tests for kernel interfaces (optional for this phase)  
**Target Platform**: Web (modern browsers, ES2020+ support)  
**Project Type**: Monorepo with pnpm workspaces, multiple library packages and one demo app  
**Performance Goals**: Render 1000+ rectangle nodes at 60 FPS; state updates within 100ms; undo/redo within 200ms; core bundle <800KB  
**Constraints**: 
- Kernel package MUST NOT depend on React or DOM APIs.
- UI package components MUST be headless (no default CSS/styles).
- React Bypass pattern: VisualEngine syncs state to LeaferJS directly, minimizing React re-renders.
- All builds use Rspack for consistency (libraries and apps).
- Strict monorepo boundaries with no circular dependencies.

**Scale/Scope**: 
- 4 packages: `thingsvis-schema`, `thingsvis-utils`, `thingsvis-kernel`, `thingsvis-ui`
- 1 demo app: `apps/preview`
- Focus on 1000-node rendering performance and basic interaction (click, undo/redo)
- Mock implementations for SafeExecutor and remote loader (full implementation deferred)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ Monorepo layout uses pnpm workspaces + Turborepo with `apps/preview`, `packages/thingsvis-schema`, `packages/thingsvis-utils`, `packages/thingsvis-kernel`, `packages/thingsvis-ui`.  
- ✅ Kernel remains UI-free (micro-kernel); `packages/thingsvis-kernel` contains pure logic (Store, EventBus, SafeExecutor) with NO React/DOM dependencies.  
- ✅ Build strategy uses Rspack (or Rsbuild) consistently for all packages and apps; TS 5.x strict is enabled across all workspaces.  
- ✅ Schemas/types live in `packages/thingsvis-schema` with Zod validation as the single source of truth; `NodeSchema` and `PageSchema` are defined before renderer implementation.  
- ✅ Rendering plan adheres to React Bypass pattern: `VisualEngine` subscribes to Zustand store and updates LeaferJS instances directly, minimizing React re-renders; no direct DOM manipulation from kernel.  
- ✅ Performance intent explicitly addresses <800KB core bundle and ≥50 FPS targets via React Bypass and efficient diff algorithm in `VisualEngine.sync()`.  
- ✅ UI package components are headless (no default styles/CSS); `HeadlessErrorBoundary` accepts `fallback` prop but applies no styles itself; styling is handled in `apps/preview` using TailwindCSS.

## Project Structure

### Documentation (this feature)

```text
specs/002-l0-kernel-engine/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
.
├── packages/
│   ├── thingsvis-schema/        # Dependency Level 0 (no dependencies)
│   │   ├── package.json
│   │   ├── rspack.config.js     # Rspack config (Library: ESM/CJS)
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── page-schema.ts   # PageSchema Zod definition
│   │       ├── node-schema.ts   # NodeSchema Zod definition
│   │       └── index.ts         # Public exports
│   │
│   ├── thingsvis-utils/         # Depends on: schema
│   │   ├── package.json
│   │   ├── rspack.config.js
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── uuid.ts          # UUID generation helper
│   │       ├── deepClone.ts     # Deep clone helper
│   │       └── index.ts
│   │
│   ├── thingsvis-kernel/        # Depends on: schema, utils
│   │   ├── package.json         # NO React/DOM dependencies
│   │   ├── rspack.config.js
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── store/
│   │       │   └── KernelStore.ts      # Vanilla Zustand + Immer
│   │       ├── history/
│   │       │   └── HistoryManager.ts   # Command Pattern undo/redo
│   │       ├── executor/
│   │       │   └── SafeExecutor.ts     # Logic Sandbox (mock for now)
│   │       ├── loader/
│   │       │   └── ResourceLoader.ts   # Remote loader (mock for now)
│   │       ├── events/
│   │       │   └── EventBus.ts         # Pub/Sub event system
│   │       └── index.ts
│   │
│   └── thingsvis-ui/            # Depends on: schema, kernel, leafer-ui
│       ├── package.json          # React + leafer-ui dependencies
│       ├── rspack.config.js
│       ├── tsconfig.json
│       └── src/
│           ├── engine/
│           │   └── VisualEngine.ts     # LeaferJS instance + sync() diff algorithm
│           ├── components/
│           │   ├── CanvasView.tsx      # React wrapper (React Bypass)
│           │   └── HeadlessErrorBoundary.tsx  # Error boundary (no styles)
│           └── index.ts
│
├── apps/
│   └── preview/                  # Depends on: all packages above
│       ├── package.json
│       ├── rspack.config.js      # Rspack config (React App)
│       ├── tsconfig.json
│       ├── index.html
│       └── src/
│           ├── main.tsx          # React app entry
│           ├── App.tsx           # Mounts <CanvasView />
│           ├── schema-1000-rects.json  # Demo schema
│           └── components/
│               └── ErrorFallback.tsx    # Styled fallback (Tailwind)
│
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.json
```

**Structure Decision**: Extend the pnpm/Turborepo monorepo with four packages (`thingsvis-schema`, `thingsvis-utils`, `thingsvis-kernel`, `thingsvis-ui`) and one demo app (`apps/preview`). All packages use Rspack for builds (library mode for packages, app mode for preview). Kernel stays pure (no React/DOM), UI package is headless (no styles), and the demo app applies styling (e.g., TailwindCSS) at the app layer. The React Bypass pattern is implemented in `VisualEngine.sync()` to efficiently update LeaferJS objects from Zustand state without triggering React re-renders for every frame.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
|           |            |                                       |

