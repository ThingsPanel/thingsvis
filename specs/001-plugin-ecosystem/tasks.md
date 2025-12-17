---
description: "Phase 3 (L1) implementation tasks"
---

# Tasks: Phase 3 — Component Ecosystem (L1)

**Input**: Design documents from `F:/coding/thingsvis/specs/001-plugin-ecosystem/`  
**Prerequisites**: `plan.md` (required), `spec.md` (required), plus `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: This feature explicitly requires visual tests: each plugin MUST include `src/spec.tsx` and the host MUST be able to run them in isolation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add workspace + repository scaffolding for `configs/`, `tools/cli`, and `plugins/`.

- [x] T001 Update pnpm workspace globs in `F:/coding/thingsvis/pnpm-workspace.yaml` to include `tools/*` and `plugins/**`
- [x] T002 [P] Create shared plugins config file `F:/coding/thingsvis/configs/rspack-plugin.config.js` (initial stub + exports)
- [x] T003 [P] Create CLI package skeleton in `F:/coding/thingsvis/tools/cli/package.json` (name `vis-cli`, bin entry, scripts)
- [x] T004 [P] Add CLI entrypoint in `F:/coding/thingsvis/tools/cli/src/index.ts` (Commander command `create <category> <name>`)
- [x] T005 [P] Add CLI templates directory `F:/coding/thingsvis/tools/cli/templates/` (boilerplate `package.json`, `rspack.config.js`, `src/index.ts`, `src/spec.tsx`, `README.md`)
- [x] T006 Wire `vis-cli` into repo scripts in `F:/coding/thingsvis/package.json` (workspace command `pnpm vis-cli ...`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T007 Add registry Zod schema + types in `F:/coding/thingsvis/packages/thingsvis-schema/src/component-registry.ts` (schemaVersion=1, entries include `remoteName`, `remoteEntryUrl`, `exposedModule`, `version`)
- [x] T008 Export registry schema/types from `F:/coding/thingsvis/packages/thingsvis-schema/src/index.ts`
- [x] T009 Add plugin module contract types in `F:/coding/thingsvis/packages/thingsvis-schema/src/plugin-module.ts` (export shape of `./Main`, including `componentId`, `create`, and `Spec` from `src/spec.tsx`)
- [x] T010 Export plugin module types from `F:/coding/thingsvis/packages/thingsvis-schema/src/index.ts`

- [x] T011 Add `idb-keyval` dependency to `F:/coding/thingsvis/packages/thingsvis-kernel/package.json`
- [x] T012 [P] Implement IDB cache helper in `F:/coding/thingsvis/packages/thingsvis-kernel/src/loader/RemoteEntryCache.ts` (get/set by `remoteEntryUrl`, store `version`, `sourceText`, timestamps) **with Chinese comments** on critical paths
- [x] T013 Implement registry-aware remote-entry resolution in `F:/coding/thingsvis/packages/thingsvis-kernel/src/loader/UniversalLoader.ts` (cache read → blob URL load → fetch/cache fallback; dedupe in-flight) **with Chinese comments**

- [x] T014 Add MF share-scope support to host build in `F:/coding/thingsvis/apps/preview/rspack.config.js` (enable Module Federation runtime sharing so remotes can consume shared singletons)
- [x] T015 Create static registry file in `F:/coding/thingsvis/apps/preview/public/registry.json` (schemaVersion=1, entries for `basic/rect`, `layout/text`, `media/image`, `custom/cyber-clock` with dev URLs + versions)
- [x] T016 [P] Add registry loader utility in `F:/coding/thingsvis/apps/preview/src/plugins/registryClient.ts` (fetch + validate with Zod; return typed map)
- [x] T017 Add plugin resolver in `F:/coding/thingsvis/apps/preview/src/plugins/pluginResolver.ts` (given `componentId` → load `./Main` via `@thingsvis/kernel` UniversalLoader; handle errors)

- [x] T018 Refactor `F:/coding/thingsvis/packages/thingsvis-ui/src/engine/VisualEngine.ts` to support “renderer per node type” (no longer hardcode `Rect` for all nodes)
- [x] T019 Implement renderer adapter interface in `F:/coding/thingsvis/packages/thingsvis-ui/src/engine/renderers/types.ts` (create/update/destroy, returns Leafer display objects)
- [x] T020 Implement “plugin renderer wrapper” in `F:/coding/thingsvis/packages/thingsvis-ui/src/engine/renderers/pluginRenderer.ts` (adapts `PluginMainModule.create()` output into VisualEngine’s renderer interface)
- [x] T021 Add error rendering behavior in `F:/coding/thingsvis/packages/thingsvis-ui/src/engine/renderers/errorRenderer.ts` (visible placeholder when node has `error` set)

**Checkpoint**: Foundation ready — the host can fetch/validate `registry.json`, load a plugin `./Main` module, and VisualEngine can render different node types via pluggable renderers.

---

## Phase 3: User Story 1 — Use “Standard Parts” in the editor (Priority: P1) 🎯 MVP

**Goal**: A page author can add `basic/rect`, `layout/text`, and `media/image` and see them render.

**Independent Test**: Run `apps/preview` and add one node of each type; each renders successfully and remains interactive.

### Implementation for User Story 1

- [x] T022 [P] [US1] Create plugin package `F:/coding/thingsvis/plugins/basic/rect/package.json` (MF remote name, deps as peers/shared, scripts: dev/build/typecheck)
- [x] T023 [P] [US1] Create plugin config `F:/coding/thingsvis/plugins/basic/rect/rspack.config.js` extending `F:/coding/thingsvis/configs/rspack-plugin.config.js`
- [x] T024 [P] [US1] Implement plugin entry `F:/coding/thingsvis/plugins/basic/rect/src/index.ts` (export `componentId="basic/rect"`, `create()`, and re-export `Spec` from `src/spec.tsx`)
- [x] T025 [P] [US1] Implement visual test `F:/coding/thingsvis/plugins/basic/rect/src/spec.tsx` (renders rect in isolation using Leafer; no host dependencies)

- [x] T026 [P] [US1] Create plugin package `F:/coding/thingsvis/plugins/layout/text/package.json`
- [x] T027 [P] [US1] Create plugin config `F:/coding/thingsvis/plugins/layout/text/rspack.config.js` extending `F:/coding/thingsvis/configs/rspack-plugin.config.js`
- [x] T028 [P] [US1] Implement plugin entry `F:/coding/thingsvis/plugins/layout/text/src/index.ts` (export `componentId="layout/text"`, `create()`, and re-export `Spec`)
- [x] T029 [P] [US1] Implement visual test `F:/coding/thingsvis/plugins/layout/text/src/spec.tsx` (renders text in isolation using Leafer)

- [x] T030 [P] [US1] Create plugin package `F:/coding/thingsvis/plugins/media/image/package.json`
- [x] T031 [P] [US1] Create plugin config `F:/coding/thingsvis/plugins/media/image/rspack.config.js` extending `F:/coding/thingsvis/configs/rspack-plugin.config.js`
- [x] T032 [P] [US1] Implement plugin entry `F:/coding/thingsvis/plugins/media/image/src/index.ts` (export `componentId="media/image"`, `create()`, and re-export `Spec`)
- [x] T033 [P] [US1] Implement visual test `F:/coding/thingsvis/plugins/media/image/src/spec.tsx` (renders image in isolation using Leafer; uses a known local/remote sample image)

- [x] T034 [US1] Add “Add Standard Parts” UI to `F:/coding/thingsvis/apps/preview/src/App.tsx` (buttons: add rect/text/image nodes with proper `node.type` values: `basic/rect`, `layout/text`, `media/image`)
- [x] T035 [US1] Wire VisualEngine to load plugin renderers via host resolver in `F:/coding/thingsvis/apps/preview/src/plugins/pluginResolver.ts` (resolve by `node.schemaRef.type`)
- [x] T036 [US1] Implement node → renderer selection in `F:/coding/thingsvis/packages/thingsvis-ui/src/engine/VisualEngine.ts` (fallback for unknown types sets node error via store)
- [x] T037 [US1] Add “plugin spec runner” UI in `F:/coding/thingsvis/apps/preview/src/App.tsx` (load selected componentId, render `Spec` in isolation, show load errors without crashing)

**Checkpoint**: US1 complete — Preview can render all three standard components and run each plugin’s `Spec` in isolation.

---

## Phase 4: User Story 2 — Continue working without network after first use (Priority: P2)

**Goal**: After loading a component once, it can be rendered again with network disabled on the same device.

**Independent Test**: Load a plugin once, then disable network in browser devtools and reload the page; previously used plugin still loads and renders.

### Implementation for User Story 2

- [x] T038 [US2] Add cache versioning checks in `F:/coding/thingsvis/apps/preview/src/plugins/registryClient.ts` (ensure `version` is passed into the loader calls)
- [x] T039 [US2] Implement Blob/ObjectURL remote load path in `F:/coding/thingsvis/packages/thingsvis-kernel/src/loader/UniversalLoader.ts` (load cached remoteEntry JS; revoke URLs safely) **with Chinese comments**
- [x] T040 [US2] Add “offline simulation instructions” to `F:/coding/thingsvis/specs/001-plugin-ecosystem/quickstart.md` (how to verify offline reuse)
- [x] T041 [US2] Add non-fatal error surfacing in `F:/coding/thingsvis/apps/preview/src/plugins/pluginResolver.ts` (set `node.error` + keep page usable when offline cache miss occurs)

**Checkpoint**: US2 complete — cached plugins load from IndexedDB and continue rendering when offline, with clear failure UI when uncached.

---

## Phase 5: User Story 3 — Create a new plugin quickly (Priority: P3)

**Goal**: A developer can run `pnpm vis-cli create <category> <name>` to generate a working plugin skeleton.

**Independent Test**: Run CLI to generate a new plugin, add it to `registry.json`, start preview, and run the plugin’s `Spec` successfully.

### Implementation for User Story 3

- [x] T042 [US3] Implement `create` command in `F:/coding/thingsvis/tools/cli/src/index.ts` (validate category/name, create directory tree, write template files)
- [x] T043 [US3] Add category taxonomy validation in `F:/coding/thingsvis/tools/cli/src/categories.ts` (the “7 Categories” list + normalization)
- [x] T044 [US3] Implement template rendering helpers in `F:/coding/thingsvis/tools/cli/src/template.ts` (replace placeholders: package name, componentId, ports, etc.)
- [x] T045 [US3] Add README instructions template in `F:/coding/thingsvis/tools/cli/templates/README.md` (how to serve remote and add to registry)
- [x] T046 [US3] Ensure generated plugin uses shared MF config in `F:/coding/thingsvis/tools/cli/templates/rspack.config.js`

**Checkpoint**: US3 complete — new plugin scaffolding works end-to-end with preview host and registry.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, docs, and consistency fixes across all stories.

- [x] T047 [P] Add Chinese comments to any critical loader/cache logic missing them in `F:/coding/thingsvis/packages/thingsvis-kernel/src/loader/UniversalLoader.ts`
- [x] T048 [P] Ensure plugins do not bundle shared deps by verifying MF `shared` config in `F:/coding/thingsvis/configs/rspack-plugin.config.js` (react/leafer/@thingsvis singletons)
- [x] T049 Update `F:/coding/thingsvis/specs/001-plugin-ecosystem/contracts/plugin-module.md` to match final exported types (if shape evolves during implementation)
- [x] T050 Run and validate the steps in `F:/coding/thingsvis/specs/001-plugin-ecosystem/quickstart.md` (fix any drift)

### Required Deliverable: AI example plugin

- [x] T051 Create plugin package `F:/coding/thingsvis/plugins/custom/cyber-clock/package.json` (remote name `thingsvis-plugin-custom-cyber-clock`, dev port 3104)
- [x] T052 Create plugin config `F:/coding/thingsvis/plugins/custom/cyber-clock/rspack.config.js` extending `F:/coding/thingsvis/configs/rspack-plugin.config.js`
- [x] T053 Implement plugin entry `F:/coding/thingsvis/plugins/custom/cyber-clock/src/index.ts` exporting `componentId="custom/cyber-clock"`, `create()`, and `Spec`
- [x] T054 Implement visual test `F:/coding/thingsvis/plugins/custom/cyber-clock/src/spec.tsx` (renders a cyber-style clock in isolation using Leafer)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **US1 (Phase 3)**: Depends on Foundational — MVP.
- **US2 (Phase 4)**: Depends on Foundational + kernel cache path exists; best validated after US1 is runnable.
- **US3 (Phase 5)**: Depends on Setup + shared plugin config; can start after Phase 1, but full end-to-end validation depends on Phase 2+.
- **Polish (Phase 6)**: After desired stories are complete.

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 only.
- **US2 (P2)**: Depends on Phase 2 and is easiest to verify once US1 runs.
- **US3 (P3)**: Depends on Phase 1; benefits from Phase 2 for full “create → register → run spec” loop.

### Parallel Opportunities

- In Phase 1, tasks T002–T005 can be parallelized.
- In Phase 2, schema tasks (T007–T010) can run in parallel with loader tasks (T011–T013) and host wiring tasks (T014–T017).
- In US1, each plugin package (rect/text/image) tasks can be done in parallel (T022–T033).

---

## Parallel Example: User Story 1

```bash
# Parallelizable plugin builds:
Task: "T022–T025 implement plugins/basic/rect/*"
Task: "T026–T029 implement plugins/layout/text/*"
Task: "T030–T033 implement plugins/media/image/*"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 → Phase 2 (foundation)
2. Phase 3 (US1) until Preview renders rect/text/image via registry + federation
3. Stop and validate US1 independently (success criteria SC-001)

### Incremental Delivery

1. Add US2 caching behavior and validate offline reuse (SC-002)
2. Add US3 CLI scaffolding and validate time-to-first-plugin (SC-004)


