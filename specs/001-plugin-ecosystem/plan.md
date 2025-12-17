# Implementation Plan: Phase 3 — Component Ecosystem (L1)

**Branch**: `001-plugin-ecosystem` | **Date**: 2025-12-17 | **Spec**: `F:/coding/thingsvis/specs/001-plugin-ecosystem/spec.md`  
**Input**: Feature specification from `F:/coding/thingsvis/specs/001-plugin-ecosystem/spec.md`

## Summary

Implement the L1 Plugin Layer by introducing a registry-driven Module Federation plugin loading flow with local caching for offline-like reuse, plus developer tooling and an initial “standard parts” plugin set:
- **Infrastructure**: `registry.json` (static) + kernel `UniversalLoader` upgrade (MF2 + IndexedDB cache).
- **DevTools**: `vis-cli` to scaffold plugin packages by category.
- **Plugins**: `basic/rect`, `layout/text`, `media/image`, and an AI-generated `custom/cyber-clock`.
- **Verification**: Each plugin includes a `spec.tsx` “visual test” runnable in isolation.

### Implementation Outline (what we will build)

- **Build system (shared plugins config)**:
  - Add `F:/coding/thingsvis/configs/rspack-plugin.config.js` as the shared Rspack configuration used by all plugin packages.
  - It discovers `src/index.ts` (or fails with a clear error) and configures MF2 with:
    - `name` derived from the plugin’s `package.json`
    - `exposes: { './Main': './src/index' }`
    - `shared` singletons for `react`, `react-dom`, `leafer-ui`, and `@thingsvis/*`
  - MVP constraint: disable plugin code-splitting to keep the remote loadable from a cached `remoteEntry.js`.

- **Registry (MVP)**:
  - Add a static `registry.json` served by a host app (e.g., `apps/preview/public/registry.json` in dev) mapping:
    - `componentId` → `{ remoteName, remoteEntryUrl, exposedModule: './Main', version }`

- **Universal Loader upgrade (kernel)**:
  - Update `F:/coding/thingsvis/packages/thingsvis-kernel/src/loader/UniversalLoader.ts`:
    - (1) Check IndexedDB for a cached `remoteEntry.js` for the `remoteEntryUrl`
    - (2) If cached and `version` matches registry: load the remote from a Blob/ObjectURL
    - (3) Else fetch `remoteEntry.js`, cache it, then load
  - Provide safe fallbacks:
    - If IndexedDB storage is unavailable, fall back to network loading
    - If load fails, return a non-fatal error boundary signal to the host
  - Add **Chinese comments** in the core caching/load path (constitution requirement).

- **CLI scaffold (`tools/cli`)**:
  - Create `F:/coding/thingsvis/tools/cli` as a Node package providing `vis-cli`.
  - Command: `pnpm vis-cli create <category> <name>`
  - Uses:
    - Commander for command parsing
    - prompts for optional interactive input
    - fs-extra to generate files from templates

- **Plugins (`plugins/`)**:
  - Create MF2 plugin packages under:
    - `plugins/basic/rect`
    - `plugins/layout/text`
    - `plugins/media/image`
    - `plugins/custom/cyber-clock`
  - Each plugin exports `./Main` and includes a `spec.tsx` that renders in isolation.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js for CLI; browser runtime for loader/host)  
**Primary Dependencies**: Rspack + Module Federation 2.0 (`@module-federation/runtime`), React 18 (host), Leafer (`leafer-ui`), Commander + prompts + fs-extra (CLI)  
**Storage**: IndexedDB via `idb-keyval` (plugin remoteEntry cache)  
**Testing**: Visual isolation tests per plugin (`spec.tsx`); contract-style tests for kernel ↔ plugin boundaries (framework to be chosen during tasks)  
**Target Platform**: Modern browsers (host apps), Node.js (CLI)  
**Project Type**: Monorepo (apps + packages + plugins + tools)  
**Performance Goals**: Maintain interactive canvas performance (≥50 FPS) and keep core host bundle lean (<800KB target from constitution)  
**Constraints**: Offline-like reuse after first plugin load; MF2 shared singletons (no duplicate core libs)  
**Scale/Scope**: MVP ecosystem: 4 plugins + shared build config + loader cache + CLI scaffold

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Monorepo layout uses pnpm workspaces + Turborepo with `apps/studio`, `apps/preview`, `packages/thingsvis-kernel`, `packages/thingsvis-schema`, `packages/thingsvis-ui`.  
- Kernel remains UI-free (micro-kernel); plugins do not create reverse deps into kernel.  
- Build strategy uses Rspack + Module Federation 2.0; TS 5.x strict is enabled.  
- Schemas/types live in `packages/thingsvis-schema` with Zod validation; changes planned before implementation.  
- Rendering plan adheres to Leafer (2D) or React Three Fiber (3D); no direct DOM access; state flows via zustand + immer.  
- Performance intent addresses <800KB core bundle and ≥50 FPS targets for relevant surfaces.  
- Plugins/components wrap with React `ErrorBoundary`; styling via TailwindCSS + `shadcn/ui` or rationale provided.

**Gate status**: PASS for planning. (Implementation will ensure kernel stays UI-free; loader cache logic stays in kernel, rendering stays in UI/host apps.)

## Project Structure

### Documentation (this feature)

```text
specs/001-plugin-ecosystem/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
apps/
├── preview/                  # Simple host for canvas + runtime loading
└── studio/                   # Full editor host

packages/
├── thingsvis-kernel/          # UniversalLoader + cache boundary, store/event-bus, safe executor
├── thingsvis-schema/          # Zod types; registry types can live here if shared across host/plugin
└── thingsvis-ui/              # VisualEngine + headless error boundary; consumes plugin renderers

configs/
└── rspack-plugin.config.js    # Shared plugin Rspack + MF2 config (used by all plugins)

tools/
└── cli/                       # vis-cli (scaffold generator)

plugins/
├── basic/
│   └── rect/                  # Standard part: rectangle
├── layout/
│   └── text/                  # Standard part: text
├── media/
│   └── image/                 # Standard part: image
└── custom/
    └── cyber-clock/           # AI-generated example plugin
```

**Structure Decision**: Monorepo feature adds `configs/`, `tools/cli/`, and `plugins/` while keeping kernel/UI/schema boundaries intact.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
