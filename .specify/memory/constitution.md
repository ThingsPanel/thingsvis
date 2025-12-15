<!--
Sync Impact Report
- Version change: N/A → 1.0.0
- Modified principles: new constitution
- Added sections: Architecture & Technology Constraints; Development Workflow & Quality Gates
- Removed sections: none
- Templates requiring updates: ✅ .specify/templates/plan-template.md | ✅ .specify/templates/spec-template.md | ✅ .specify/templates/tasks-template.md | ⚠️ commands templates (not present)
- Follow-up TODOs: TODO(RATIFICATION_DATE): original adoption date not provided
-->

# ThingsVis Constitution

## Core Principles

### I. Monorepo & Workspace Discipline
ThingsVis MUST operate as a pnpm workspace monorepo orchestrated by Turborepo with the canonical layout: `apps/studio`, `apps/preview`, `packages/thingsvis-kernel`, `packages/thingsvis-schema`, and `packages/thingsvis-ui`. Cross-package imports follow layered boundaries (kernel L0 → plugins L1 → editor L2) and MUST avoid circular deps. Rationale: keeps build graph predictable and enables cacheable, incremental delivery.

### II. Micro-Kernel Isolation
The kernel (L0) owns lifecycle, messaging, and event routing. It MUST NOT depend on plugins (L1) or the editor (L2); plugins integrate only through published contracts and schema. Plugins MUST be loadable/unloadable without kernel recompilation. Rationale: preserves extensibility and runtime safety.

### III. Stack Mandates & Type Safety
Rspack with Module Federation 2.0 is mandatory for builds and plugin packaging. TypeScript 5.x runs in strict mode across all workspaces. Runtime validation uses Zod in `packages/thingsvis-schema` as the single source of truth for types shared across kernel, plugins, and UIs. Rationale: predictable builds and contract safety.

### IV. Rendering & State Pipeline
Rendering MUST be state-driven: State → Schema → Renderer. 2D uses `leafer-ui` + `@leafer-in/editor`; 3D uses `react-three-fiber` + `@react-three/drei`. State management uses `zustand` with `immer` for immutable updates. No direct DOM manipulation; all UI updates flow through the renderer abstractions. Rationale: deterministic visuals and safer multi-surface rendering.

### V. Performance, Safety & UI Discipline
Core runtime bundle size MUST stay under 800KB and target ≥50 FPS rendering. All plugins/components MUST be wrapped in React `ErrorBoundary`, include structured logging, and adhere to TailwindCSS + `shadcn/ui` styling primitives. Rationale: resilient operator experiences in industrial contexts.

## Architecture & Technology Constraints

- Monorepo builds use Rspack + Module Federation 2.0; MF contracts declare exposed/remotes per plugin.  
- Layering: kernel (logic-only) is UI-free; UI lives in `apps/studio`/`apps/preview` and `packages/thingsvis-ui`.  
- Schema ownership: all shared shapes, events, and configuration types live in `packages/thingsvis-schema` and are validated with Zod before runtime use.  
- Rendering surfaces: 2D via Leafer stack; 3D via React Three Fiber stack; mixing requires schema-declared capability flags.  
- State: centralized stores with zustand/immer; mutations go through typed actions to keep time-travel/debugging feasible.  
- Performance: enforce bundle budget (<800KB core), FPS target (≥50), and avoid blocking work on render threads.

## Development Workflow & Quality Gates

- Spec-driven development is mandatory: define/update schemas and types before implementation.  
- Constitution Check in plans/specs MUST confirm: monorepo boundaries respected, Rspack/MF2 used, TS strict enabled, schemas live in `thingsvis-schema`, renderers avoid direct DOM, performance budgets planned, and plugins isolated from kernel.  
- PRs require: Zod validation for new/changed data shapes, ErrorBoundary coverage for plugins, and evidence of bundle/FPS impact where rendering paths change.  
- Styling work uses TailwindCSS with `shadcn/ui` components; deviations require documented rationale.  
- Testing emphasis: contract tests for kernel ↔ plugin interfaces and renderer behaviors; regression guards for performance-sensitive paths.

## Governance

- This constitution supersedes conflicting guidelines. Amendments require documented rationale, version bump per semantic rules, and an impact note in the Sync Impact Report.  
- Compliance reviews: every plan/spec/tasks run must include a Constitution Check; code reviews block on violations unless explicitly justified in a Complexity/Violation log.  
- Versioning policy: MAJOR for principle/gov removals or incompatible redefinitions; MINOR for new principles/sections or material expansions; PATCH for clarifications.  
- Runtime guidance: schemas and contracts in `packages/thingsvis-schema` are the source of truth; kernel must stay UI-free; plugins must not create reverse deps into kernel.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date not provided | **Last Amended**: 2025-12-15
