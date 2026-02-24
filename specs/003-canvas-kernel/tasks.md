# Tasks: Canvas Kernel (003-canvas-kernel)

Phase 1 — Setup

- [ ] T001 Initialize feature workspace and branch metadata in `specs/003-canvas-kernel/README.md`
- [ ] T002 [P] Create initial TypeScript Zod schema stubs in `packages/thingsvis-schema/src/canvas-schema.ts`
- [ ] T003 Install and build workspace prerequisites (pnpm) — run in repo root: `pnpm -w install` and `pnpm -w build` (no file change)

Phase 2 — Foundational (blocking)

- [ ] T004 [US1] Implement Kernel Store surface (API skeleton) in `packages/thingsvis-kernel/src/store/index.ts`
- [ ] T005 [US1] Add typed actions (addNode/updateNode/removeNode/setSelection/group/ungroup) in `packages/thingsvis-kernel/src/store/actions.ts`
- [ ] T006 [US1] Add patch subscription API `subscribeToPatches` in `packages/thingsvis-kernel/src/store/subscribe.ts`
- [ ] T007 [US1] Add SafeExecutor skeleton to kernel in `packages/thingsvis-kernel/src/safe-executor.ts`
- [ ] T008 [US1] Add ETL worker entry `packages/thingsvis-kernel/src/etl-worker.ts` and worker build entry `packages/thingsvis-kernel/src/etl-worker.entry.ts`
- [ ] T009 [US1] Add kernel EventBus messages types in `packages/thingsvis-kernel/src/events/types.ts` (NODE_ADD, NODE_UPDATE, etc.)
- [ ] T010 [P] Add Zod schema implementations from `specs/003-canvas-kernel/data-model.md` into `packages/thingsvis-schema/src/canvas-schema.ts`

Phase 3 — User Story Phases (priority order)

US1 — 设计者在 Studio 中搭建高性能多模式画布 (Priority: P1)

- [ ] T011 [US1] Add VisualEngine wrapper API in `packages/thingsvis-ui/src/visual-engine/VisualEngine.ts`
- [ ] T012 [US1] Implement `CanvasView` React wrapper in `packages/thingsvis-ui/src/CanvasView.tsx` (mount point only; minimal React)
- [ ] T013 [US1] Integrate Leafer adapter skeleton in `packages/thingsvis-ui/src/adapters/leafer-adapter.ts`
- [ ] T014 [US1] Implement Fixed/Infinite/Reflow mode switching in `packages/thingsvis-ui/src/modes/mode-controller.ts`
- [ ] T015 [US1] Wire kernel store -> VisualEngine subscription and initial render loop in `packages/thingsvis-ui/src/visual-engine/render-loop.ts`
- [ ] T016 [US1] Create demo Studio integration example in `apps/studio/src/widgets/canvas-integration/CanvasDemo.tsx`
- [ ] T017 [US1] Add basic performance profiling overlay (fps, dirty count) in `packages/thingsvis-ui/src/debug/perf-overlay.tsx`
- [ ] T018 [P] Add fixtures for 1k/5k/10k nodes in `specs/003-canvas-kernel/fixtures/{1k,5k,10k}.json`
- [ ] T019 [US1] Benchmark script to load fixture and measure first-frame time in `specs/003-canvas-kernel/benchmarks/measure-first-frame.ts`

US2 — 设计者在画布中对单个或多个组件进行精细编辑 (Priority: P2)

- [ ] T020 [US2] Add Moveable integration scaffold in `packages/thingsvis-ui/src/tools/moveable-adapter.ts`
- [ ] T021 [US2] Implement selection state mapping and transform handle state in `packages/thingsvis-kernel/src/selection/index.ts`
- [ ] T022 [US2] Implement transform application action `action.applyTransform` in `packages/thingsvis-kernel/src/store/actions.ts`
- [ ] T023 [US2] Implement snapping/align helper (spatial index) in `packages/thingsvis-ui/src/utils/snapping.ts`
- [ ] T024 [US2] Add group/ungroup service implementation in `packages/thingsvis-kernel/src/group/service.ts`
- [ ] T025 [P] Add unit tests for selection and group logic in `packages/thingsvis-kernel/src/__tests__/selection.spec.ts`
- [ ] T026 [US2] Add UI helpers for alignment guides in `packages/thingsvis-ui/src/guides/alignment-guides.tsx`

US3 — 运行态安全消费画布视图 (Priority: P3)

- [ ] T027 [US3] Implement `HeadlessErrorBoundary` component in `packages/thingsvis-ui/src/HeadlessErrorBoundary.tsx`
- [ ] T028 [US3] Wire plugin lifecycle: registerPlugin/mount/update/unmount hooks in `packages/thingsvis-kernel/src/plugin-registry.ts`
- [ ] T029 [US3] Emit and log PLUGIN_ERROR via EventBus in `packages/thingsvis-kernel/src/events/emit.ts`
- [ ] T030 [US3] Add Studio-level error placeholder UI component in `apps/studio/src/components/PluginErrorPlaceholder.tsx`
- [ ] T031 [US3] Add observability hook to forward ErrorBoundary captures to kernel logging in `packages/thingsvis-ui/src/observability/error-forwarder.ts`
- [ ] T032 [P] Create contract tests that simulate 3 plugins throwing errors and verify canvas remains interactive in `specs/003-canvas-kernel/tests/plugin-isolation.spec.ts`

Phase 4 — Polish & Cross-cutting

- [ ] T033 [P] Add TypeScript types for contracts into `packages/thingsvis-schema/src/contracts/canvas-contracts.ts` (based on `specs/003-canvas-kernel/contracts`)
- [ ] T034 Generate README and integration docs: `specs/003-canvas-kernel/README.md`
- [ ] T035 Add CI job snippet (rspack build + bench) in `.github/workflows/canvas-kernel-ci.yml`
- [ ] T036 [P] Conduct full perf run and record results in `specs/003-canvas-kernel/benchmarks/results.md`
- [ ] T037 Accessibility pass for CanvasView in `packages/thingsvis-ui/src/CanvasView.a11y.md`
- [ ] T038 Security review checklist entry in `specs/003-canvas-kernel/checklists/security.md`

Dependencies (high-level)

- US1 depends on: Phase1 (T002/T010), Phase2 (T004-T009), Zod schemas (T010)
- US2 depends on: US1 (T011-T016), selection actions (T005/T022), snapping (T023)
- US3 depends on: Plugin registry (T028), ErrorBoundary (T027), EventBus (T009/T029)

Parallel Opportunities

- Tasks marked `[P]` are safe to run in parallel (Zod schema implementation, fixtures, contract ts types, some tests, README generation).

MVP Suggestion

- Implement minimal pipeline for US1 only: T002, T004-T006, T010-T016, T018-T019, T033 (types), then verify first-frame <1.5s on 1k fixture.

Counts & Validation

- Total tasks: 38  
- Tasks per story: US1: 9 (T011-T019), US2: 7 (T020-T026), US3: 6 (T027-T032), Setup/Foundational/Polish: 16 (T001-T010,T033-T038)  
- All tasks follow checklist format with Task IDs and file paths.  

Path: `specs/003-canvas-kernel/tasks.md`


