# Feature Specification: Foundation Scaffold Initialization

**Feature Branch**: `001-foundation-scaffold`  
**Created**: 2025-12-15  
**Status**: Draft  
**Input**: User description: "I want to initialize the \"Foundation Scaffold\" for ThingsVis."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Monorepo Root Ready (Priority: P1)

Repository maintainers need a reproducible root scaffold so any contributor can clone and immediately work with pnpm + Turborepo.

**Why this priority**: Without the root workspace, no apps or packages can install dependencies or share tooling.

**Independent Test**: Clone the repository, run the standard workspace install process, and confirm workspace detection plus build pipeline configuration succeed without manual edits.

**Acceptance Scenarios**:

1. **Given** a clean clone, **When** the workspace install finishes, **Then** workspaces resolve `apps/*` and `packages/*` with a single lockfile.
2. **Given** a contributor triggers the shared build pipeline, **When** the tasks execute, **Then** they use the standardized pipeline definition without errors.

---

### User Story 2 - Core Packages Bootstrapped (Priority: P2)

Platform engineers need the schema and kernel packages scaffolded with baseline exports to unblock downstream dependents.

**Why this priority**: Schema definitions and kernel lifecycle objects are prerequisites for both apps and plugins.

**Independent Test**: Run package-level build/test scripts to confirm `packages/thingsvis-schema` exports `PageSchema` via Zod and `packages/thingsvis-kernel` exposes an `EventBus` class without runtime errors.

**Acceptance Scenarios**:

1. **Given** consumers import `@thingsvis/schema`, **When** they request `PageSchema`, **Then** they receive a Zod object describing `id`, `version`, and `type` fields.
2. **Given** consumers import `@thingsvis/kernel`, **When** they instantiate `EventBus`, **Then** it compiles with empty methods ready for future logic.

---

### User Story 3 - Studio App Boots (Priority: P3)

Studio developers need a React 18 + Rspack shell with TailwindCSS so UI exploration can start immediately.

**Why this priority**: Studio is the primary editor; even a placeholder app must verify bundler, styling, and internal package linkage.

**Independent Test**: Start the studio development server to confirm the bundler serves a basic page that imports a value from `@thingsvis/schema`.

**Acceptance Scenarios**:

1. **Given** the studio dev server runs, **When** the root route loads, **Then** it renders a placeholder component that echoes schema data without console errors.
2. **Given** Tailwind is configured, **When** developers add utility classes, **Then** styles compile via the shared config with no manual wiring.

---

### Edge Cases

- Workspace discovery fails if additional folders (e.g., `examples/`) are added later; scaffold must allow future expansion without rewriting `package.json`.
- pnpm CLI missing on a contributor device; provide fallback instructions so onboarding is unblocked.
- Schema or kernel package builds should not break when no additional source files exist yet.

## Requirements *(mandatory)*

**Constitution Alignment**: Scaffold MUST respect pnpm+Turborepo monorepo boundaries, enforce TS 5.x strict via shared configs, rely on Zod schemas inside `packages/thingsvis-schema`, avoid direct DOM mutations (even in placeholder app), plan for Leafer/React Three Fiber renderer integration later, use zustand/immer for future state management, keep bundle budgets visible, and wrap future plugins/components in ErrorBoundaries.

### Functional Requirements

- **FR-001**: Root `package.json` MUST define pnpm workspaces for `apps/*` and `packages/*`, set the package manager field, and include base scripts (`dev`, `build`, `lint`) routed through Turborepo.
- **FR-002**: `turbo.json` MUST define pipeline tasks (e.g., `build`, `dev`, `lint`, `typecheck`) with cache settings that apply to apps and packages uniformly.
- **FR-003**: A top-level `tsconfig.json` MUST share React/TS 5.x strict settings and be extendable by every workspace project.
- **FR-004**: `packages/thingsvis-schema` MUST ship a minimal Zod-powered `PageSchema` (fields: `id`, `version`, `type`) and publish its build entry to consumers under the `@thingsvis/schema` path.
- **FR-005**: `packages/thingsvis-kernel` MUST expose a compile-ready `EventBus` class and type declarations, even if methods are placeholders.
- **FR-006**: `apps/studio` MUST boot with React 18, Rspack config, TailwindCSS pipeline, and demonstrate a live import from `@thingsvis/schema`.
- **FR-007**: Workspace linking MUST be verified via pnpm filters so apps can depend on packages without relative path hacks.

### Key Entities *(include if feature involves data)*

- **WorkspaceConfig**: Represents the monorepo definition (package manager metadata, workspace globs, turbo pipelines) coordinating how apps/packages build together.
- **SchemaPackage**: Describes the published schema library containing versioned Zod types and export surface such as `PageSchema`.
- **KernelPackage**: Describes the logic-only kernel artifacts, starting with the `EventBus` class, which higher layers depend upon.
- **StudioShell**: Represents the initial editor application container responsible for loading React, Tailwind, and consuming internal packages.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A fresh clone plus the standard workspace install finishes in under 2 minutes on a standard developer laptop without manual edits.
- **SC-002**: The shared build pipeline executes successfully across all workspaces with zero warnings related to missing configs.
- **SC-003**: Importing `PageSchema` from `@thingsvis/schema` and `EventBus` from `@thingsvis/kernel` succeeds inside the studio app with no TypeScript errors.
- **SC-004**: Studio dev server renders the placeholder UI within 5 seconds of launch and reflects Tailwind utility styling.

## Assumptions

- Contributors have pnpm 8+ installed globally or follow documented install instructions.
- No backend services are required for this scaffold; focus stays on repo structure and local builds.
- Leafer/React Three Fiber assets are deferred until rendering features begin, but configs must not block their addition.

## Dependencies & Risks

- Rspack project templates must support Module Federation 2.0 to align with the constitution; verify sample config compatibility early.
- TailwindCSS configuration relies on PostCSS tooling; missing dependencies could block dev server startup.
- Schema package will eventually version data contracts; even early placeholders must follow semver publishing expectations.
