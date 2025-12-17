---
description: "Tasks for Phase 2 - L0 Kernel Engine (Universal Loader & Logic Sandbox)"
---

# Tasks: Phase 2 - L0 Kernel Engine (Universal Loader & Logic Sandbox)

**Input**: Design documents from `specs/002-l0-kernel-engine/`  
**Prerequisites**: `plan.md`, `spec.md`, `data-model.md`, `research.md`, `quickstart.md`

**Tests**: No automated tests required for this slice; manual verification is acceptable.

**Organization**: Tasks are grouped by phase and user story to keep loader and sandbox work independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US4 aligns to error isolation in the spec)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure workspace/build wiring accounts for new kernel loader dependencies.

- [ ] T001 Confirm workspace build graph includes kernel changes in `pnpm-workspace.yaml` and `turbo.json`
- [ ] T002 [P] Install/update workspace dependencies via root `package.json` to make Module Federation runtime available

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add Module Federation runtime deps and core primitives for dynamic loading and safe execution in the kernel.

- [x] T003 Add `@module-federation/enhanced` and `@module-federation/runtime` dependencies in `packages/thingsvis-kernel/package.json`
- [ ] T004 [P] Ensure `packages/thingsvis-kernel/rspack.config.js` (or equivalent) bundles new runtime deps without React/DOM leakage
- [x] T005 Implement singleton `Loader` with remote cache in `packages/thingsvis-kernel/src/loader/UniversalLoader.ts` (store promises keyed by scope)
- [x] T006 [P] Add `registerRemote(name, entry)` using `init()` and `loadComponent(scope, module)` using `loadRemote()` with cached promises in `packages/thingsvis-kernel/src/loader/UniversalLoader.ts`
- [x] T007 Implement `safeExecute<T>(fn, fallback)` try/catch with console logging (Proxy placeholder for future hardening) in `packages/thingsvis-kernel/src/sandbox/SafeExecutor.ts`
- [x] T008 [P] Export `UniversalLoader` and `safeExecute` from `packages/thingsvis-kernel/src/index.ts`

**Checkpoint**: Kernel builds with Module Federation runtime deps; loader and sandbox utilities exist and are exported.

---

## Phase 3: User Story 4 - Isolate component errors without crashing (Priority: P2)

**Goal**: Ensure loader-triggered plugin/component execution can be isolated and surfaced safely.

**Independent Test**: Dynamically register a remote, load a component module, execute its factory via `safeExecute`, and confirm failures are caught/logged without breaking other nodes.

- [ ] T009 [US4] Wrap remote component factory invocation with `safeExecute` guard in `packages/thingsvis-kernel/src/loader/UniversalLoader.ts`
- [ ] T010 [P] [US4] Add manual validation notes for dynamic remote load + sandbox fallback in `specs/002-l0-kernel-engine/quickstart.md`

**Checkpoint**: Remote plugin execution is guarded; failures are contained per component.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Hardening and documentation follow-ups for loader/sandbox.

- [ ] T011 [P] Document loader and sandbox public API expectations in `packages/thingsvis-kernel/README.md` (or package-level docs)
- [ ] T012 Add minimal console-based error reporting hook placeholder for future `ErrorStore` in `packages/thingsvis-kernel/src/sandbox/SafeExecutor.ts`

---

## Dependencies & Execution Order

- **Setup  Foundational  US4  Polish** in sequence.
- T003 blocks T005T006; T005 blocks T009.
- Parallel options: T002 with T001; T004 with T005; T006 with T007; T010 with T011T012.
