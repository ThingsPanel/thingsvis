# Tasks: Superset 风格优先的数据配置与绑定 (007-widget-style)

**Input**: Design documents in `specs/007-widget-style/` (plan/spec/contracts/data-model/research/quickstart)

**Tests**: Not adding automated test tasks (repo has no single test runner wired for this feature); rely on `pnpm typecheck` + the manual acceptance scenarios in `spec.md` / `quickstart.md`.

---

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Confirm workspace build/typecheck entrypoints exist for Studio + schema packages in package.json
- [X] T002 Confirm Turbo pipeline provides `typecheck` and `build` tasks in turbo.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: Complete this phase before starting any user story tasks.

- [X] T003 Add serializable Controls contract schema/types in packages/thingsvis-schema/src/plugin-controls.ts
- [X] T004 Extend PluginMainModule to include optional controls in packages/thingsvis-schema/src/plugin-module.ts
- [X] T005 Export Controls contract from packages/thingsvis-schema/src/index.ts
- [X] T006 [P] Add Controls safe-parse helper for Studio in apps/studio/src/plugins/getPluginControls.ts
- [X] T007 [P] Implement binding read/write helpers (static/field/expr) in apps/studio/src/components/RightPanel/bindingStorage.ts
- [X] T008 [P] Implement depth/size-limited field path traversal in apps/studio/src/components/RightPanel/fieldPath.ts
- [X] T009 [P] Implement Field Picker UI (dataSource + field selection) in apps/studio/src/components/RightPanel/FieldPicker.tsx
- [X] T010 Implement generic controls-based field row renderer in apps/studio/src/components/RightPanel/ControlFieldRow.tsx
- [X] T011 Implement controls-first PropsPanel fallback wiring in apps/studio/src/components/RightPanel/PropsPanel.tsx

**Checkpoint**: Studio can render a controls-driven panel when `Main.controls` is present, and falls back safely when it’s missing/invalid.

---

## Phase 3: User Story 1 — Bind text via Field Picker (Priority: P1) 🎯 MVP

**Goal**: Bind `basic-text`’s `text` prop by selecting a data source + field (no manual expression typing).

**Independent Test**: Create a basic text node, switch `text` to Field mode, pick a data source + field path, and verify the canvas text updates; panel clearly indicates `text` is bound.

- [X] T012 [US1] Declare Controls for `basic-text.text` (Content group) in plugins/basic/text/src/spec.tsx
- [X] T013 [US1] Render `text` control from plugin Controls in apps/studio/src/components/RightPanel/PropsPanel.tsx
- [X] T014 [US1] Persist field-binding for `text` as DataBinding in apps/studio/src/components/RightPanel/bindingStorage.ts
- [X] T015 [US1] Show “static overridden by binding” indicator for `text` in apps/studio/src/components/RightPanel/ControlFieldRow.tsx

**Checkpoint**: US1 acceptance scenarios in `spec.md` pass for `text`.

---

## Phase 4: User Story 2 — Bind style properties with clear override state (Priority: P2)

**Goal**: Keep style properties static by default, and allow switching to Field binding with a clear override indicator.

**Independent Test**: For a basic text node, switch `fill` or `fontSize` between Static and Field modes and verify the canvas rendering + panel state match.

- [X] T016 [US2] Declare Controls for `basic-text.fill` and `basic-text.fontSize` (Style group) in plugins/basic/text/src/spec.tsx
- [X] T017 [US2] Add `color` static input support for Controls in apps/studio/src/components/RightPanel/ControlFieldRow.tsx
- [X] T018 [US2] Add `number` static input support for Controls in apps/studio/src/components/RightPanel/ControlFieldRow.tsx
- [X] T019 [US2] Implement static↔field mode transitions for style fields in apps/studio/src/components/RightPanel/bindingStorage.ts

**Checkpoint**: US2 acceptance scenarios in `spec.md` pass for `fill` and `fontSize`.

---

## Phase 5: User Story 3 — Advanced fallback to expressions (Priority: P3)

**Goal**: Allow advanced users to bind via `{{ ... }}` expressions as a fallback mode.

**Independent Test**: Switch a supported field to Expr mode, enter a valid `{{ ... }}` expression, and verify rendered output matches; panel indicates Expr mode.

- [X] T020 [US3] Enable `expr` binding mode for relevant fields in plugins/basic/text/src/spec.tsx
- [X] T021 [US3] Add Expr editor UI for Controls fields in apps/studio/src/components/RightPanel/ControlFieldRow.tsx
- [X] T022 [US3] Validate expression format (`/^\{\{.*\}\}$/`) and block invalid saves in apps/studio/src/components/RightPanel/ControlFieldRow.tsx
- [X] T023 [US3] Implement binding mode detection heuristic (field vs expr) in apps/studio/src/components/RightPanel/bindingStorage.ts
- [X] T024 [US3] Surface dev-only diagnostics when Controls are invalid and fallback is used in apps/studio/src/plugins/getPluginControls.ts

**Checkpoint**: US3 acceptance scenario in `spec.md` passes for at least one field.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T025 [P] Update adoption/validation steps to match final UX in specs/007-widget-style/quickstart.md
- [X] T026 [P] Document Field Picker depth/size defaults in specs/007-widget-style/research.md
- [X] T027 Run `pnpm typecheck` and fix any new TS errors related to changes (package.json)
- [ ] T028 Run the manual end-to-end checklist and update notes in specs/007-widget-style/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) → Foundational (Phase 2) → User Stories (Phases 3–5) → Polish (Phase 6)

### User Story Dependencies

- US1 depends on Phase 2.
- US2 depends on Phase 2 (no hard dependency on US1 if Controls renderer supports `color`/`number`).
- US3 depends on Phase 2.

### Within Each User Story

- Controls declaration (plugin) before panel rendering validation.
- Binding storage updates before UI wiring that relies on them.

---

## Parallel Execution Examples

### Foundational (after T005)

- T006 (apps/studio/src/plugins/getPluginControls.ts)
- T007 (apps/studio/src/components/RightPanel/bindingStorage.ts)
- T008 (apps/studio/src/components/RightPanel/fieldPath.ts)
- T009 (apps/studio/src/components/RightPanel/FieldPicker.tsx)

### US2

- T017 (apps/studio/src/components/RightPanel/ControlFieldRow.tsx)
- T018 (apps/studio/src/components/RightPanel/ControlFieldRow.tsx)

(These two both touch the same file; if parallelizing, split per-kind renderer into separate files first.)

---

## Implementation Strategy

### MVP First (US1 only)

1. Finish Phase 1–2.
2. Implement Phase 3 (US1).
3. Validate against US1 acceptance scenarios in `specs/007-widget-style/spec.md`.

### Incremental Delivery

- Add US2 without changing persistence format (still `node.schemaRef.props` + `node.schemaRef.data`).
- Add US3 as UI-only expression fallback; do not change runtime evaluation semantics.
