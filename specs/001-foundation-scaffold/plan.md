# Implementation Plan: Foundation Scaffold Initialization

**Branch**: `001-foundation-scaffold` | **Date**: 2025-12-15 | **Spec**: [specs/001-foundation-scaffold/spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-foundation-scaffold/spec.md`

## Summary

Initialize the ThingsVis monorepo foundation so contributors can clone the repository, install dependencies, and build a minimal set of apps and packages in a single, coherent workspace. This includes pnpm workspace and Turborepo setup, shared TypeScript configuration, baseline schema/kernel/ui packages, and a React 18 studio app built with Rspack (via Rsbuild) plus TailwindCSS, all wired together through workspace dependencies.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), JavaScript targeting modern evergreen browsers  
**Primary Dependencies**: pnpm, Turborepo, TypeScript, tsup, Zod, React 18, Rsbuild (`@rsbuild/core` + `@rsbuild/plugin-react`), TailwindCSS, PostCSS  
**Storage**: N/A for this scaffold (no backend or persistence yet)  
**Testing**: Basic TypeScript type-check and build verification; future tests to be added in later features  
**Target Platform**: Web (desktop-first industrial consoles)  
**Project Type**: Monorepo with apps (`apps/*`) and packages (`packages/*`)  
**Performance Goals**: Keep scaffold lean; ensure builds are fast and ready to conform to <800KB core bundle and ≥50 FPS targets as features are added  
**Constraints**: Must honor ThingsVis constitution (micro-kernel, pnpm+Turbo, Rspack-based builds, TS strict, Zod schemas, state-driven rendering, Tailwind + shadcn/ui styling)  
**Scale/Scope**: Initial skeleton only—one studio app and three core packages (`thingsvis-schema`, `thingsvis-kernel`, `thingsvis-ui`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Monorepo layout uses pnpm workspaces + Turborepo with `apps/studio`, `apps/preview` (placeholder), `packages/thingsvis-kernel`, `packages/thingsvis-schema`, `packages/thingsvis-ui`.  
- Kernel remains UI-free (micro-kernel); `thingsvis-kernel` exposes logic-only `EventBus` and MUST NOT depend on React or DOM APIs.  
- Build strategy uses a Rspack-based toolchain via Rsbuild for `apps/studio`; future Module Federation 2.0 configuration will be added when plugins are introduced.  
- Schemas/types live in `packages/thingsvis-schema` with Zod validation; `PageSchema` is the first exported type.  
- Rendering plan for this feature only boots React; Leafer/React Three Fiber integration is deferred but must not be blocked by scaffold decisions.  
- Performance intent: pipelines and configs are structured so bundle budgets and performance checks can be added without restructuring.  
- Plugins/components will be wrapped with React `ErrorBoundary` in later features; no plugin system is implemented in this scaffold.

## Project Structure

### Documentation (this feature)

```text
specs/001-foundation-scaffold/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command, future)
├── data-model.md        # Phase 1 output (/speckit.plan command, future)
├── quickstart.md        # Phase 1 output (/speckit.plan command, future)
├── contracts/           # Phase 1 output (/speckit.plan command, future)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
.
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.json
├── apps/
│   ├── studio/
│   │   ├── rsbuild.config.ts
│   │   ├── tsconfig.json
│   │   ├── index.html
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   └── App.tsx
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.cjs
│   │   └── src/index.css
│   └── preview/              # Placeholder app to be wired in later features
├── packages/
│   ├── thingsvis-schema/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   └── page-schema.ts
│   │   └── tsup.config.ts
│   ├── thingsvis-kernel/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   └── event-bus.ts
│   │   └── tsup.config.ts
│   └── thingsvis-ui/
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   └── Button.tsx
│       └── tsup.config.ts
└── specs/
    └── 001-foundation-scaffold/
        ├── spec.md
        └── checklists/
            └── requirements.md
```

**Structure Decision**: Use a pnpm/Turborepo monorepo with `apps/*` and `packages/*`, a shared root `tsconfig.json`, and per-package tsup configs for build outputs. Rsbuild drives the Rspack-based bundling for `apps/studio` while internal packages build as separate libraries consumed via workspace dependencies.

## Phase Breakdown & Tasks

### Phase 1: Root Monorepo Setup

**Goal**: Establish the workspace, tooling, and base configuration for all apps/packages.

- Create root `package.json`  
  - Set `name`, `private: true`, and `packageManager` (pnpm).  
  - Add workspace scripts:  
    - `"dev": "turbo run dev"`  
    - `"build": "turbo run build"`  
    - `"lint": "turbo run lint"`  
    - `"typecheck": "turbo run typecheck"`  
  - Add dev dependencies: `turbo`, `typescript`, and any shared tooling (ESLint/Prettier in future features).

- Add `pnpm-workspace.yaml`  
  - Define `packages:` including `"apps/*"` and `"packages/*"`.  
  - Leave room for future folders like `examples/*` without breaking workspace discovery.

- Add `turbo.json`  
  - Define pipelines for `build`, `dev`, `lint`, `typecheck` with sensible caching and dependency ordering (e.g., `^build` for packages).  
  - Ensure tasks can run across apps and packages from the root.

- Create root `tsconfig.json`  
  - Enable TS 5.x strict mode, React JSX runtime, and path base settings.  
  - Configure `compilerOptions` suitable for both libraries and apps (e.g., `module`, `target`, `jsx`, `moduleResolution`, `strict: true`).  
  - Expose as `"extends"` target for all package/app `tsconfig.json` files.

**Verification**: Run `pnpm install` at root to ensure workspace detection; run `pnpm turbo run typecheck --filter ./packages/...` to confirm root TypeScript configuration is consumable.

### Phase 2: Core Packages (Schema, Kernel, UI)

**Goal**: Bootstrap the three foundational packages with tsup-based builds and minimal exports.

#### 2.1 `packages/thingsvis-schema`

- Create `packages/thingsvis-schema/package.json`  
  - Set `name: "@thingsvis/schema"`, `main`, `module`, `types`, and `exports` fields pointing to tsup build outputs (e.g., `dist/index.js`, `dist/index.d.ts`).  
  - Add scripts: `"build": "tsup src/index.ts --dts"`, `"dev": "tsup src/index.ts --dts --watch"`, `"lint"`/`"typecheck"` delegating to root where applicable.  
  - Add dependencies: `"zod"`; devDependencies: `"tsup"`, `"typescript"`.

- Add `tsconfig.json` for the package extending root config  
  - Configure `include` for `src/**/*`.  
  - Ensure `declaration` and `emitDeclarationOnly` align with tsup’s `--dts`.

- Implement initial schema source  
  - `src/page-schema.ts`: define and export `PageSchema` using `z.object({ id: z.string(), version: z.string(), type: z.string() })`.  
  - `src/index.ts`: re-export `PageSchema` as the public API.

- Optional: `tsup.config.ts`  
  - Centralize tsup options (format, target, dts) if preferred over CLI flags.

**Verification**: Run `pnpm build --filter @thingsvis/schema` and confirm dist outputs and type declarations are generated without errors.

#### 2.2 `packages/thingsvis-kernel`

- Create `packages/thingsvis-kernel/package.json`  
  - Set `name: "@thingsvis/kernel"`, similar entry points/exports structure as schema.  
  - Scripts for `build`, `dev`, and `typecheck` using tsup and TypeScript.  
  - DevDependencies: `"tsup"`, `"typescript"`. No React or DOM-related dependencies.

- Add `tsconfig.json` extending root  
  - Same pattern as schema: `include` `src/**/*`, library-friendly compiler options.

- Implement initial kernel source  
  - `src/event-bus.ts`: declare an `EventBus` class with placeholder methods (e.g., `on`, `off`, `emit`) but no implementation logic yet.  
  - `src/index.ts`: export `EventBus` as the public API.

- Optional: `tsup.config.ts` mirroring schema’s config.

**Verification**: Run `pnpm build --filter @thingsvis/kernel` and confirm the package builds and emits typings, with no React or DOM imports.

#### 2.3 `packages/thingsvis-ui`

- Create `packages/thingsvis-ui/package.json`  
  - Set `name: "@thingsvis/ui"`, and mark `"sideEffects": false` where appropriate.  
  - Define entry points for ESM/CTS and types; configure `"peerDependencies"` for `react` and `react-dom` to avoid bundling them.  
  - Scripts: `build` + `dev` via tsup with React/JSX support.

- Add `tsconfig.json` extending root  
  - Enable `jsx: "react-jsx"` and React typings.  
  - Include `src/**/*`.

- Implement a dummy React component  
  - `src/Button.tsx`: simple typed button component (e.g., props for `label`/`children`), no styling beyond basic markup for now.  
  - `src/index.ts`: export `Button`.

- Configure tsup for React output  
  - Add `tsup.config.ts` specifying `jsx` handling, externalizing `react` and `react-dom`.

**Verification**: Run `pnpm build --filter @thingsvis/ui` and ensure the bundle is generated with React marked as external and types emitted.

### Phase 3: Studio Application with Rsbuild (Rspack) and TailwindCSS

**Goal**: Stand up `apps/studio` as a React 18 app that consumes internal packages and is styled via TailwindCSS.

- Scaffold `apps/studio` directory structure  
  - Add `package.json` with `name: "studio"`, `private: true`, scripts: `"dev"`, `"build"`, `"lint"`, `"typecheck"` wired to Rsbuild and tooling.  
  - Declare dependencies: `react`, `react-dom`, `@rsbuild/core`, `@rsbuild/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer`.  
  - Declare workspace dependencies: `"@thingsvis/schema": "workspace:*"`, `"@thingsvis/kernel": "workspace:*"`, `"@thingsvis/ui": "workspace:*"`.

- Configure Rsbuild for Rspack  
  - Add `rsbuild.config.ts` that:  
    - Uses `@rsbuild/plugin-react` for React 18.  
    - Sets entry point to `src/main.tsx`.  
    - Configures TypeScript support and resolves workspace packages.  
    - Leaves room for future Module Federation config while keeping current setup simple.

- Add app-level `tsconfig.json`  
  - Extend root `tsconfig.json`.  
  - Set `include` to `src/**/*` and `vite-env`-equivalent types if needed for Rsbuild.

- Implement basic React shell  
  - `src/main.tsx`: bootstrap React root, render `<App />`, import `./index.css`.  
  - `src/App.tsx`:  
    - Import `PageSchema` from `@thingsvis/schema`.  
    - Optionally instantiate `EventBus` from `@thingsvis/kernel`.  
    - Render a simple layout using Tailwind utility classes and optionally the `Button` from `@thingsvis/ui`.

- Configure TailwindCSS + PostCSS  
  - Initialize `tailwind.config.ts` pointing `content` to `./index.html` and `./src/**/*.{ts,tsx}`.  
  - Add `postcss.config.cjs` with `tailwindcss` and `autoprefixer` plugins.  
  - Create `src/index.css` importing Tailwind base/components/utilities.

**Verification**: Run `pnpm dev --filter ./apps/studio` (or equivalent Turbo-driven dev) and confirm the app serves, imports internal packages, and applies Tailwind classes without build errors.

### Phase 4: Workspace Wiring & Verification

**Goal**: Ensure all pieces link correctly through pnpm + Turborepo and that basic builds succeed from the root.

- Confirm workspace dependencies  
  - Check that `apps/studio` lists `@thingsvis/schema`, `@thingsvis/kernel`, and `@thingsvis/ui` as `"workspace:*"` dependencies.  
  - Ensure package names in `package.json` match their import paths.

- Run root-level install  
  - Execute `pnpm install` from the repository root to install dependencies and wire workspaces.  
  - Fix any peer dependency or resolution issues discovered during this step.

- Run root-level builds  
  - Execute `pnpm build` from the root, which should trigger `turbo run build` across all workspaces.  
  - Confirm that `thingsvis-schema`, `thingsvis-kernel`, `thingsvis-ui`, and `apps/studio` all build successfully.  
  - Optionally run `pnpm typecheck` to verify TypeScript configuration integrity.

**Success Criteria Alignment**  
- Validate that a fresh clone + install completes successfully and `pnpm build` passes.  
- Confirm imports from `@thingsvis/schema` and `@thingsvis/kernel` inside `apps/studio` work without TypeScript or runtime errors.  
- Confirm studio dev server starts quickly and renders Tailwind-styled UI using internal package exports.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
|           |            |                                       |


