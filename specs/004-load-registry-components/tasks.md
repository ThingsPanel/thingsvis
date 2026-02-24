# Tasks: Load registry components & left-panel DnD

**Input**: Design docs from `specs/004-load-registry-components/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`  

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create core adapters, loaders and kernel command scaffolding used by all stories

- [x] T001 Create `apps/studio/src/components/CanvasView.tsx` scaffold that mounts a container `div` for the VisualEngine and exposes lifecycle hooks (`mount`, `unmount`) and a `dispatchToKernel` prop.  
- [x] T002 Create `packages/thingsvis-ui/visual/leaferAdapter.ts` file with exported class `LeaferAdapter` and placeholder methods `init(viewportEl)`, `addNode(nodeId, renderSpec)`, `removeNode(nodeId)`, `updateNodeTransform(nodeId, transform)`.  
- [x] T003 [P] Create `packages/thingsvis-ui/loader/dynamicLoader.ts` skeleton implementing `loadWidget(remoteEntryUrl, exposedModule)` and `getRegistryEntries(url?)` signatures (MF2 runtime + ESM-fallback placeholders).  
- [x] T004 [P] Create `packages/thingsvis-ui/utils/coords.ts` with `screenToCanvas(screenPoint, canvasConfig, viewportState)` and `canvasToScreen(worldPoint, canvasConfig, viewportState)` exports.  
- [x] T005 Create `packages/thingsvis-kernel/commands/nodeDrop.ts` file with Command skeleton (export default Command object shape) and unit-test stub `packages/thingsvis-kernel/tests/nodeDrop.spec.ts`.  
- [x] T006 Integrate SafeExecutor usage placeholder: add `packages/thingsvis-kernel/src/sandbox/ensureSafeExecution.ts` helper that documents how loader will call `SafeExecutor.run(fn)`.  
- [x] T007 Add event hooks file `packages/thingsvis-kernel/src/events/pluginEvents.ts` exporting typed events `plugin.load.start|success|failure` and `node.created`.
 - [x] T002 Create `@thingsvis/ui/visual/leaferAdapter` (exported from package entrypoint) with exported class `LeaferAdapter` and placeholder methods `init(viewportEl)`, `addNode(nodeId, renderSpec)`, `removeNode(nodeId)`, `updateNodeTransform(nodeId, transform)`.  
 - [x] T003 [P] Create `@thingsvis/ui/loader/dynamicLoader` (exported from package entrypoint) skeleton implementing `loadWidget(remoteEntryUrl, exposedModule)` and `getRegistryEntries(url?)` signatures (MF2 runtime + ESM-fallback placeholders).  
 - [x] T004 [P] Create `@thingsvis/ui/utils/coords` (exported from package entrypoint) with `screenToCanvas(screenPoint, canvasConfig, viewportState)` and `canvasToScreen(worldPoint, canvasConfig, viewportState)` exports.  
 - [x] T005 Create `@thingsvis/kernel/commands/nodeDrop` (exported from package entrypoint) file with Command skeleton (export default Command object shape) and unit-test stub `@thingsvis/kernel/tests/nodeDrop.spec.ts`.  
 - [x] T006 Integrate SafeExecutor usage placeholder: add `@thingsvis/kernel/src/sandbox/ensureSafeExecution` helper that documents how loader will call `SafeExecutor.run(fn)`.  
 - [x] T007 Add event hooks file `@thingsvis/kernel/src/events/pluginEvents` exporting typed events `plugin.load.start|success|failure` and `node.created`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, schemas and history readiness — MUST complete before user stories

- [ ] T008 Add `packages/thingsvis-schema/src/schemas/componentRegistryEntry.ts` Zod schema for `ComponentRegistryEntry` and export from package index.  
- [ ] T009 Verify `packages/thingsvis-kernel/src/history/HistoryManager.ts` supports push/undo/redo and add a unit test `packages/thingsvis-kernel/tests/historyCapacity.spec.ts` asserting 50+ commands are supported.  
 - [x] T009 Verify `packages/thingsvis-kernel/src/history/HistoryManager.ts` supports push/undo/redo and add a unit test `packages/thingsvis-kernel/tests/historyCapacity.spec.ts` asserting 50+ commands are supported.  
- [ ] T010 Add `packages/thingsvis-ui/src/components/HeadlessErrorBoundary.tsx` placeholder (headless, no styles) if missing; export for use by CanvasView.  
- [ ] T011 Add small CI/local fixture `apps/preview/public/registry.json` check script `scripts/validate-registry.js` used by quickstart to validate schema.
 - [ ] T008 Add `@thingsvis/schema/src/schemas/componentRegistryEntry` Zod schema for `ComponentRegistryEntry` and export from package index (`@thingsvis/schema`).  
 - [ ] T009 Verify `@thingsvis/kernel/src/history/HistoryManager` supports push/undo/redo and add a unit test `@thingsvis/kernel/tests/historyCapacity.spec.ts` asserting 50+ commands are supported.  
 - [ ] T010 Add `@thingsvis/ui/components/HeadlessErrorBoundary` placeholder (headless, no styles) if missing; export for use by CanvasView via `@thingsvis/ui`.  
 - [ ] T011 Add small CI/local fixture `apps/preview/public/registry.json` check script `scripts/validate-registry.js` used by quickstart to validate schema.

---

## Phase 3: User Story 1 - Load components into left panel (Priority: P1) 🎯 MVP

**Goal**: Left panel lists registry entries from `registry.json` and is independently testable.  
**Independent Test**: Run studio dev with fixture registry and verify left panel shows the entries within 2s.

- [ ] T012 [US1] Implement `packages/thingsvis-ui/loader/registryLoader.ts` with `getRegistryEntries(url?)` that reads `apps/preview/public/registry.json` by default and validates entries via Zod schema (`packages/thingsvis-schema`).  
- [ ] T013 [P] [US1] Implement left-panel component `apps/studio/src/components/LeftPanel/ComponentsList.tsx` that calls `getRegistryEntries()` and renders list items (displayName + icon placeholder).  
- [ ] T014 [US1] Add unit test `packages/thingsvis-ui/tests/registryLoader.spec.ts` validating parsing/validation and error cases (missing/invalid registry).  
- [ ] T015 [US1] Add E2E smoke `apps/studio/tests/us1-registry.spec.ts` that starts studio + preview, loads page, and asserts left panel entries are visible.
 - [ ] T012 [US1] Implement `@thingsvis/ui/loader/registryLoader` (exported API) with `getRegistryEntries(url?)` that reads `apps/preview/public/registry.json` by default and validates entries via Zod schema (`@thingsvis/schema`).  
 - [ ] T013 [P] [US1] Implement left-panel component `apps/studio/src/components/LeftPanel/ComponentsList.tsx` that calls `getRegistryEntries()` and renders list items (displayName + icon placeholder).  
 - [ ] T014 [US1] Add unit test `@thingsvis/ui/tests/registryLoader.spec.ts` validating parsing/validation and error cases (missing/invalid registry).  
 - [ ] T015 [US1] Add E2E smoke `apps/studio/tests/us1-registry.spec.ts` that starts studio + preview, loads page, and asserts left panel entries are visible.

---

## Phase 4: User Story 2 - Drag component to canvas (Priority: P1)

**Goal**: Drag from left panel and drop onto canvas creates a Kernel `node.drop` Command and results are undoable.  
**Independent Test**: Drag an item to canvas, verify a `node.drop` command is pushed to HistoryManager and Undo removes the node.

- [ ] T016 [US2] Implement `dragstart` and dataTransfer payload in `apps/studio/src/components/LeftPanel/ComponentsList.tsx` (include `remoteName`, `remoteEntryUrl`, `exposedModule`).  
- [ ] T017 [US2] Implement `onDrop` handler in `apps/studio/src/components/CanvasView.tsx` that: reads event screen coords, calls `screenToCanvas`, and calls kernel API to dispatch a `node.drop` command with computed world coords (call into `packages/thingsvis-kernel` command API).  
- [ ] T018 [US2] Implement `execute()` / `undo()` logic in `packages/thingsvis-kernel/commands/nodeDrop.ts` to insert/remove node from `nodesById`, update page schema, and set/restore selection.  
- [ ] T019 [US2] Add integration test `apps/studio/tests/dnd-undo.spec.ts` that performs drop via browser automation, asserts KernelState snapshot changed, invokes Undo, and asserts snapshot equality with pre-drop state.
- [ ] T020 [US2] Add telemetry/event assertions in `packages/thingsvis-kernel/tests/pluginLoadEvents.spec.ts` ensuring `plugin.load.*` events are emitted during load.
 - [x] T019 [US2] Add integration test `apps/studio/tests/dnd-undo.spec.ts` that performs drop via browser automation, asserts KernelState snapshot changed, invokes Undo, and asserts snapshot equality with pre-drop state.  
 - [x] T020 [US2] Add telemetry/event assertions in `packages/thingsvis-kernel/tests/pluginLoadEvents.spec.ts` ensuring `plugin.load.*` events are emitted during load.
 - [x] T018 [US2] Implement `execute()` / `undo()` logic in `packages/thingsvis-kernel/commands/nodeDrop.ts` to insert/remove node from `nodesById`, update page schema, and set/restore selection.  
 - [ ] T019 [US2] Add integration test `apps/studio/tests/dnd-undo.spec.ts` that performs drop via browser automation, asserts KernelState snapshot changed, invokes Undo, and asserts snapshot equality with pre-drop state.
 - [ ] T020 [US2] Add telemetry/event assertions in `packages/thingsvis-kernel/tests/pluginLoadEvents.spec.ts` ensuring `plugin.load.*` events are emitted during load.
 - [x] T016 [US2] Implement `dragstart` and dataTransfer payload in `apps/studio/src/components/LeftPanel/ComponentsList.tsx` (include `remoteName`, `remoteEntryUrl`, `exposedModule`).  
 - [x] T017 [US2] Implement `onDrop` handler in `apps/studio/src/components/CanvasView.tsx` that: reads event screen coords, calls `screenToCanvas`, and calls kernel API to dispatch a `node.drop` command with computed world coords (call into `@thingsvis/kernel` command API).  
 - [ ] T018 [US2] Implement `execute()` / `undo()` logic in `@thingsvis/kernel/commands/nodeDrop` to insert/remove node from `nodesById`, update page schema, and set/restore selection.  
 - [ ] T019 [US2] Add integration test `apps/studio/tests/dnd-undo.spec.ts` that performs drop via browser automation, asserts KernelState snapshot changed, invokes Undo, and asserts snapshot equality with pre-drop state.
 - [ ] T020 [US2] Add telemetry/event assertions in `@thingsvis/kernel/tests/pluginLoadEvents.spec.ts` ensuring `plugin.load.*` events are emitted during load.
 - [ ] T016 [US2] Implement `dragstart` and dataTransfer payload in `apps/studio/src/components/LeftPanel/ComponentsList.tsx` (include `remoteName`, `remoteEntryUrl`, `exposedModule`).  
 - [ ] T017 [US2] Implement `onDrop` handler in `apps/studio/src/components/CanvasView.tsx` that: reads event screen coords, calls `screenToCanvas`, and calls kernel API to dispatch a `node.drop` command with computed world coords (call into `@thingsvis/kernel` command API).  
 - [ ] T018 [US2] Implement `execute()` / `undo()` logic in `@thingsvis/kernel/commands/nodeDrop` to insert/remove node from `nodesById`, update page schema, and set/restore selection.  
 - [ ] T019 [US2] Add integration test `apps/studio/tests/dnd-undo.spec.ts` that performs drop via browser automation, asserts KernelState snapshot changed, invokes Undo, and asserts snapshot equality with pre-drop state.  
 - [ ] T020 [US2] Add telemetry/event assertions in `@thingsvis/kernel/tests/pluginLoadEvents.spec.ts` ensuring `plugin.load.*` events are emitted during load.

---

## Phase 5: User Story 3 - Replace canvas placeholder with rendered instance (Priority: P2)

**Goal**: The central placeholder is replaced by a live Leafer-rendered canvas and dropped components render inside sandbox.  
**Independent Test**: Drop a component when placeholder is present; placeholder replaced, node rendered via Leafer, and misbehaving component is contained.

- [ ] T021 [US3] In `apps/studio/src/components/CanvasView.tsx`, call `LeaferAdapter.init(viewportEl)` on mount and switch UI from placeholder to mounted canvas when first node is added.  
- [ ] T022 [US3] Implement `LeaferAdapter.addNode()` to accept a `renderSpec` returned from loaded plugin module and attach a visual primitive to the Leafer viewport (`packages/thingsvis-ui/visual/leaferAdapter.ts`).  
- [ ] T023 [US3] Ensure `packages/thingsvis-ui/loader/dynamicLoader.ts` executes plugin factories under `SafeExecutor.run(fn)` and returns a safe factory wrapper to VisualEngine.  
- [ ] T024 [US3] Add sandbox acceptance test `tests/widgets/misbehaving-plugin.spec.ts` that loads a widget which throws on init and asserts editor remains responsive and component shows error state.
 - [ ] T021 [US3] In `apps/studio/src/components/CanvasView.tsx`, call `LeaferAdapter.init(viewportEl)` on mount and switch UI from placeholder to mounted canvas when first node is added.  
 - [ ] T022 [US3] Implement `LeaferAdapter.addNode()` to accept a `renderSpec` returned from loaded plugin module and attach a visual primitive to the Leafer viewport (implement in `@thingsvis/ui/visual/leaferAdapter`).  
 - [ ] T023 [US3] Ensure `@thingsvis/ui/loader/dynamicLoader` executes plugin factories under `SafeExecutor.run(fn)` and returns a safe factory wrapper to VisualEngine.  
 - [ ] T024 [US3] Add sandbox acceptance test `tests/widgets/misbehaving-plugin.spec.ts` that loads a widget which throws on init and asserts editor remains responsive and component shows error state.

---

## Phase 6: Interaction & Transactions (Cross-cutting)

**Goal**: Selection/Transform interactions dispatch Commands and are undoable; maintain performance targets.  

- [ ] T025 [P] Integrate `moveable` & `selecto` in `apps/studio/src/components/tools/TransformControls.tsx` and emit interaction events to kernel.  
- [ ] T026 [P] Implement Command classes for `node.move`, `node.resize`, `node.rotate` in `packages/thingsvis-kernel/commands/` with `execute`/`undo`.  
- [ ] T027 [P] Add performance smoke script `scripts/perf/smoke-studio.sh` and add a CI job placeholder `ci/perf-studio.yml` to validate ≥50 FPS on a simple scene.  
- [ ] T028 Implement unit tests `packages/thingsvis-kernel/tests/command.spec.ts` to validate `undo`/`redo` correctness for transform commands.
 - [x] T026 [P] Implement Command classes for `node.move`, `node.resize`, `node.rotate` in `packages/thingsvis-kernel/commands/` with `execute`/`undo`.  
 - [ ] T027 [P] Add performance smoke script `scripts/perf/smoke-studio.sh` and add a CI job placeholder `ci/perf-studio.yml` to validate ≥50 FPS on a simple scene.  
 - [ ] T028 Implement unit tests `packages/thingsvis-kernel/tests/command.spec.ts` to validate `undo`/`redo` correctness for transform commands.
 - [ ] T025 [P] Integrate `moveable` & `selecto` in `apps/studio/src/components/tools/TransformControls.tsx` and emit interaction events to kernel.  
 - [ ] T026 [P] Implement Command classes for `node.move`, `node.resize`, `node.rotate` in `@thingsvis/kernel/commands` with `execute`/`undo`.  
 - [ ] T027 [P] Add performance smoke script `scripts/perf/smoke-studio.sh` and add a CI job placeholder `ci/perf-studio.yml` to validate ≥50 FPS on a simple scene.  
 - [ ] T028 Implement unit tests `@thingsvis/kernel/tests/command.spec.ts` to validate `undo`/`redo` correctness for transform commands.

---

## Phase 7: DnD UX polish & Schema-driven props (Polish)

**Goal**: Improve DnD UX, grid snapping, keyboard insert, and dynamic property panel driven from schema.  

- [ ] T029 [US2] Implement drag ghost UX in `apps/studio/src/components/LeftPanel/ComponentsList.tsx` and CSS in `apps/studio/src/styles/` (tailwind usage only in apps).  
- [ ] T030 [US2] Implement grid snapping during drop in `packages/thingsvis-ui/utils/coords.ts` using `canvasConfig.gridSize`.  
- [ ] T031 [US3] Implement dynamic props panel generator in `apps/studio/src/components/RightPanel/PropsPanel.tsx` that reads component `PropsSchema` from loaded plugin and renders inputs.  
- [ ] T032 Documentation: add `docs/studio/dnd-and-sandbox.md` summarizing runtime sandbox rules (A1) and command/undo flows.
 - [ ] T029 [US2] Implement drag ghost UX in `apps/studio/src/components/LeftPanel/ComponentsList.tsx` and CSS in `apps/studio/src/styles/` (tailwind usage only in apps).  
 - [ ] T030 [US2] Implement grid snapping during drop in `@thingsvis/ui/utils/coords` using `canvasConfig.gridSize`.  
 - [ ] T031 [US3] Implement dynamic props panel generator in `apps/studio/src/components/RightPanel/PropsPanel.tsx` that reads component `PropsSchema` from loaded plugin (provided by `@thingsvis/ui` loader) and renders inputs.  
 - [ ] T032 Documentation: add `docs/studio/dnd-and-sandbox.md` summarizing runtime sandbox rules (A1) and command/undo flows.

---

## Dependencies & Execution Order

- Phase 1 (Setup) must complete before Phase 2 (Foundational) tasks that rely on created files.  
- Phase 2 (Foundational) must complete before any User Story phases.  
- User Story phases (US1, US2, US3) may be executed in parallel after Foundational completes; US1 recommended MVP first.  

## Parallel Opportunities

- T003, T004, T006, T007, T013 can be executed in parallel by separate contributors (different files).  
- Transform commands (T025–T026) and performance tasks (T027) can be parallelized after VisualEngine is integrated.

## Implementation Strategy

- MVP: Complete Phase 1 → Phase 2 → Phase 3 (US1) and validate that left panel loads registry and shows entries.  
- Next: Implement US2 drop+undo flow and US3 placeholder replacement with Leafer rendering.  
- Incrementally add interaction commands and polish.


