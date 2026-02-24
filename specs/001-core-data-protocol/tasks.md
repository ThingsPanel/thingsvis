# Tasks: Core Data Protocol and Kernel Interfaces

**Input**: Design documents from `/specs/001-core-data-protocol/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are NOT included in this feature - only schema validation and type checking are required.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo (ThingsVis)**: `packages/thingsvis-schema/`, `packages/thingsvis-kernel/`
- **Schema Package**: `packages/thingsvis-schema/src/page.ts`, `component.ts`, `index.ts`
- **Kernel Package**: `packages/thingsvis-kernel/src/interfaces/visual-component.ts`, `plugin-factory.ts`, `index.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify project structure and prepare for implementation

- [x] T001 Verify packages/thingsvis-schema exists with src/ directory
- [x] T002 Verify packages/thingsvis-kernel exists with src/ directory
- [x] T003 [P] Verify TypeScript 5.x strict mode is enabled in both packages
- [x] T004 [P] Verify Zod dependency exists in packages/thingsvis-schema/package.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create src/interfaces/ directory in packages/thingsvis-kernel/src/
- [x] T006 Add @thingsvis/schema as dependency in packages/thingsvis-kernel/package.json

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Define Page Structure Schema (Priority: P1) 🎯 MVP

**Goal**: Implement PageSchema with Meta, Config, and Content validation using Zod. This enables developers to create and validate page definitions with metadata, display settings, and component layouts.

**Independent Test**: Create a page definition object with all required fields, validate it using `PageSchema.safeParse()`, and confirm it passes validation. Then test with missing required fields and invalid enum values to confirm validation rejects them with clear error messages.

### Implementation for User Story 1

- [x] T007 [US1] Create PageMetaSchema in packages/thingsvis-schema/src/page.ts with id (uuid), version (default "1.0.0"), name, and scope enum ('app' | 'template')
- [x] T008 [US1] Create PageConfigSchema in packages/thingsvis-schema/src/page.ts with mode enum ('fixed' | 'infinite' | 'reflow'), width (default 1920), height (default 1080), and theme enum ('dark' | 'light' | 'auto')
- [x] T009 [US1] Create PageSchema in packages/thingsvis-schema/src/page.ts combining PageMetaSchema, PageConfigSchema, and Content with nodes array (references VisualComponentSchema from US2)
- [x] T010 [US1] Export PageSchema and inferred IPage type from packages/thingsvis-schema/src/page.ts
- [x] T011 [US1] Verify PageSchema validates valid page definitions with all required fields
- [x] T012 [US1] Verify PageSchema rejects invalid configurations (missing fields, invalid enums, wrong types)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. PageSchema can validate page definitions with proper error messages.

---

## Phase 4: User Story 2 - Define Component Structure Schema (Priority: P1) 🎯 MVP

**Goal**: Implement VisualComponentSchema with Identity, Transform, Data, Props, and Events validation using Zod. This enables developers to create and validate component definitions with identity, positioning, data bindings, properties, and event handlers.

**Independent Test**: Create a component definition object with all required fields, validate it using `VisualComponentSchema.safeParse()`, and confirm it passes validation. Then test with missing required fields and invalid values to confirm validation rejects them with clear error messages.

### Implementation for User Story 2

- [x] T013 [US2] Create ComponentIdentitySchema in packages/thingsvis-schema/src/component.ts with id (uuid), type (string), name (string), locked (default false), and hidden (default false)
- [x] T014 [US2] Create ComponentTransformSchema in packages/thingsvis-schema/src/component.ts with x, y, width, height (all numbers), and rotation (default 0)
- [x] T015 [US2] Create ComponentDataSchema in packages/thingsvis-schema/src/component.ts with sourceId (string), topic (string), and transform (string)
- [x] T016 [US2] Create ComponentEventSchema in packages/thingsvis-schema/src/component.ts with trigger (string), action (string), and payload (unknown)
- [x] T017 [US2] Create VisualComponentSchema in packages/thingsvis-schema/src/component.ts combining ComponentIdentitySchema, ComponentTransformSchema, ComponentDataSchema, props (Record<string, unknown>, default {}), and events array (default [])
- [x] T018 [US2] Export VisualComponentSchema and inferred IVisualComponent type from packages/thingsvis-schema/src/component.ts
- [x] T019 [US2] Update PageSchema in packages/thingsvis-schema/src/page.ts to reference VisualComponentSchema for nodes array
- [x] T020 [US2] Verify VisualComponentSchema validates valid component definitions with all required fields
- [x] T021 [US2] Verify VisualComponentSchema rejects invalid configurations (missing fields, invalid types)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Both PageSchema and VisualComponentSchema can validate their respective definitions with proper error messages.

---

## Phase 5: User Story 3 - Define Kernel Component Interface (Priority: P2)

**Goal**: Implement IVisualComponent interface in kernel package with mount, update, resize, and unmount methods. This enables plugin developers to create components that integrate with kernel lifecycle management.

**Independent Test**: Create a component class that implements IVisualComponent, instantiate it, and verify it exposes mount(el, props), update(props), resize(w, h), and unmount() methods with correct signatures. Verify TypeScript type checking catches errors when methods are missing or have wrong signatures.

### Implementation for User Story 3

- [x] T022 [US3] Create IVisualComponent interface in packages/thingsvis-kernel/src/interfaces/visual-component.ts with mount(el: HTMLElement, props: Record<string, unknown>): void method
- [x] T023 [US3] Add update(props: Record<string, unknown>): void method to IVisualComponent interface in packages/thingsvis-kernel/src/interfaces/visual-component.ts
- [x] T024 [US3] Add resize(width: number, height: number): void method to IVisualComponent interface in packages/thingsvis-kernel/src/interfaces/visual-component.ts
- [x] T025 [US3] Add unmount(): void method to IVisualComponent interface in packages/thingsvis-kernel/src/interfaces/visual-component.ts
- [x] T026 [US3] Add JSDoc comments to IVisualComponent interface methods documenting contracts, preconditions, postconditions, and error conditions in packages/thingsvis-kernel/src/interfaces/visual-component.ts
- [x] T027 [US3] Verify IVisualComponent interface has no any types (use Record<string, unknown> for props)
- [x] T028 [US3] Export IVisualComponent from packages/thingsvis-kernel/src/interfaces/visual-component.ts

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently. IVisualComponent interface is defined and ready for plugin implementations.

---

## Phase 6: User Story 4 - Define Plugin Factory Interface (Priority: P2)

**Goal**: Implement IWidgetFactory interface in kernel package with create(type) method. This enables the kernel to dynamically create component instances from loaded widgets without requiring kernel recompilation.

**Independent Test**: Create a factory class that implements IWidgetFactory, register it with a test kernel, and verify the kernel can call create(type) with a component type string to obtain a new IVisualComponent instance. Verify error handling for unsupported component types.

### Implementation for User Story 4

- [x] T029 [US4] Create IWidgetFactory interface in packages/thingsvis-kernel/src/interfaces/plugin-factory.ts with create(type: string): IVisualComponent method
- [x] T030 [US4] Add JSDoc comments to IWidgetFactory interface documenting contract, preconditions, postconditions, and error conditions in packages/thingsvis-kernel/src/interfaces/plugin-factory.ts
- [x] T031 [US4] Verify IWidgetFactory interface has no any types (return type is IVisualComponent, parameter is string)
- [x] T032 [US4] Export IWidgetFactory from packages/thingsvis-kernel/src/interfaces/plugin-factory.ts

**Checkpoint**: At this point, all user stories should be independently functional. Both kernel interfaces are defined and ready for plugin system integration.

---

## Phase 7: Integration & Exports

**Purpose**: Aggregate exports and ensure cross-package type safety

- [x] T033 Update packages/thingsvis-schema/src/index.ts to export PageSchema, VisualComponentSchema, and all inferred types (IPage, IVisualComponent, IPageMeta, IPageConfig, IComponentIdentity, IComponentTransform, IComponentData, IComponentEvent)
- [x] T034 Update packages/thingsvis-kernel/src/index.ts to export IVisualComponent from interfaces/visual-component.ts and IWidgetFactory from interfaces/plugin-factory.ts
- [x] T035 Update packages/thingsvis-kernel/src/index.ts to re-export existing EventBus and EventHandler types
- [x] T036 Verify packages/thingsvis-kernel can import types from @thingsvis/schema without circular dependencies

---

## Phase 8: Type Safety Verification & Polish

**Purpose**: Ensure strict type safety and validate all requirements

- [x] T037 [P] Run tsc --noEmit on packages/thingsvis-schema to verify no type errors
- [x] T038 [P] Run tsc --noEmit on packages/thingsvis-kernel to verify no type errors
- [x] T039 Verify no any types exist in exported interfaces (check IVisualComponent and IWidgetFactory)
- [x] T040 Verify types are properly inferred from Zod schemas using z.infer (check IPage, IVisualComponent types)
- [x] T041 Verify kernel package can import and use schema types without import errors
- [x] T042 Build both packages using pnpm build to verify build succeeds
- [x] T043 Verify all functional requirements (FR-001 through FR-012) are met by reviewing implementation
- [x] T044 Create validation test examples demonstrating schema validation with valid and invalid inputs

**Checkpoint**: All requirements met, type safety verified, packages build successfully

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 (Phase 3): Can start after Foundational - No dependencies on other stories
  - User Story 2 (Phase 4): Can start after Foundational - References VisualComponentSchema in PageSchema (T019 depends on T017)
  - User Story 3 (Phase 5): Can start after Foundational - No dependencies on other stories (interfaces only)
  - User Story 4 (Phase 6): Depends on User Story 3 (IWidgetFactory returns IVisualComponent)
- **Integration (Phase 7)**: Depends on all user stories (Phases 3-6) completion
- **Polish (Phase 8)**: Depends on Integration phase completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent except T019 needs VisualComponentSchema from US2
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 4 (P2)**: Depends on User Story 3 - IWidgetFactory.create() returns IVisualComponent

### Within Each User Story

- Schema sub-schemas before main schema (e.g., PageMetaSchema before PageSchema)
- Component sub-schemas before VisualComponentSchema
- Interface definition before export
- Implementation before verification
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003, T004)
- User Story 1 tasks T007-T010 can run sequentially (dependencies: T007→T008→T009→T010)
- User Story 2 tasks T013-T017 can run sequentially (dependencies: T013→T014→T015→T016→T017)
- User Story 3 tasks T022-T028 can run sequentially (all in same file)
- User Story 4 tasks T029-T032 can run sequentially (all in same file)
- Phase 8 type safety verification tasks T037-T038 can run in parallel (different packages)
- User Stories 1 and 3 can be worked on in parallel after Foundational phase (different packages, no dependencies)

---

## Parallel Example: User Story 1

```bash
# Sequential execution (dependencies):
Task T007: Create PageMetaSchema
  ↓
Task T008: Create PageConfigSchema  
  ↓
Task T009: Create PageSchema (combines T007, T008, and references VisualComponentSchema)
  ↓
Task T010: Export PageSchema and IPage type
  ↓
Task T011: Verify validation with valid inputs
  ↓
Task T012: Verify validation with invalid inputs
```

---

## Parallel Example: User Stories 1 and 3

```bash
# After Foundational phase completes, these can run in parallel:

Developer A: User Story 1 (Schema Package)
  Task T007: Create PageMetaSchema in packages/thingsvis-schema/src/page.ts
  Task T008: Create PageConfigSchema in packages/thingsvis-schema/src/page.ts
  Task T009: Create PageSchema in packages/thingsvis-schema/src/page.ts
  Task T010: Export PageSchema and IPage type

Developer B: User Story 3 (Kernel Package)
  Task T022: Create IVisualComponent interface in packages/thingsvis-kernel/src/interfaces/visual-component.ts
  Task T023: Add update method to IVisualComponent
  Task T024: Add resize method to IVisualComponent
  Task T025: Add unmount method to IVisualComponent
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Page Schema)
4. Complete Phase 4: User Story 2 (Component Schema) - Note: T019 depends on T017
5. Complete Phase 7: Integration & Exports (T033)
6. **STOP and VALIDATE**: Test schemas independently - create page/component definitions and validate them
7. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Validate page definitions (MVP Part 1!)
3. Add User Story 2 → Test independently → Validate component definitions (MVP Part 2!)
4. Add User Story 3 → Test independently → Verify interface contract
5. Add User Story 4 → Test independently → Verify factory contract
6. Complete Integration & Polish → Full feature complete
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Page Schema) - packages/thingsvis-schema/src/page.ts
   - Developer B: User Story 2 (Component Schema) - packages/thingsvis-schema/src/component.ts
   - Developer C: User Story 3 (IVisualComponent) - packages/thingsvis-kernel/src/interfaces/visual-component.ts
3. After User Story 3 completes:
   - Developer C: User Story 4 (IWidgetFactory) - packages/thingsvis-kernel/src/interfaces/plugin-factory.ts
4. Team completes Integration & Polish together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Schema validation tests are manual (create objects and validate with safeParse)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- User Story 2 task T019 depends on T017 (VisualComponentSchema must exist before PageSchema references it)
- User Story 4 depends on User Story 3 (IWidgetFactory returns IVisualComponent)

