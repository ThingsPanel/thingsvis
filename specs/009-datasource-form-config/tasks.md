# Tasks: 数据源表单配置增强 (REST & WebSocket Form Configuration)

**Input**: Design documents from `/specs/009-datasource-form-config/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not explicitly requested - test tasks omitted per instructions.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md project structure:
- **Schema**: `packages/thingsvis-schema/src/datasource/`
- **Kernel**: `packages/thingsvis-kernel/src/datasources/`
- **UI**: `apps/studio/src/`

---

## Phase 1: Setup (Schema Layer)

**Purpose**: Extend Zod schemas with new configuration entities, ensuring backward compatibility

- [X] T001 Create AuthConfigSchema in `packages/thingsvis-schema/src/datasource/auth-config.ts` with discriminated union (none/bearer/basic/apiKey)
- [X] T002 [P] Create ReconnectPolicySchema in `packages/thingsvis-schema/src/datasource/reconnect-config.ts`
- [X] T003 [P] Create HeartbeatConfigSchema in `packages/thingsvis-schema/src/datasource/heartbeat-config.ts`
- [X] T004 Extend RESTConfigSchema in `packages/thingsvis-schema/src/datasource/index.ts` with body, timeout, auth fields (all optional with defaults)
- [X] T005 Extend WSConfigSchema in `packages/thingsvis-schema/src/datasource/index.ts` with reconnect, heartbeat, initMessages fields (all optional with defaults)
- [X] T006 Export all new schemas and types from `packages/thingsvis-schema/src/datasource/index.ts`
- [X] T007 Run `pnpm typecheck --filter @thingsvis/schema` to validate

**Checkpoint**: Schema layer complete - all new types exported and type-safe ✅

---

## Phase 2: Foundational (Kernel Layer + Reusable UI Components)

**Purpose**: Core infrastructure that MUST be complete before ANY user story UI can be implemented

**⚠️ CRITICAL**: User story form work depends on these kernel enhancements and base components

### Kernel Enhancements

- [X] T008 Add `generateAuthHeaders` and `generateAuthParams` utility functions in `packages/thingsvis-kernel/src/datasources/auth-utils.ts`
- [X] T009 Add `fetchWithTimeout` helper using AbortController in `packages/thingsvis-kernel/src/datasources/RESTAdapter.ts`
- [X] T010 Add `calculateReconnectDelay`, `shouldReconnect`, `getEffectiveReconnectPolicy` utilities in `packages/thingsvis-kernel/src/datasources/ws-utils.ts`
- [X] T011 Enhance RESTAdapter: integrate auth header injection, body sending, and timeout in `packages/thingsvis-kernel/src/datasources/RESTAdapter.ts`
- [X] T012 Enhance WSAdapter: add reconnection state machine and exponential backoff logic in `packages/thingsvis-kernel/src/datasources/WSAdapter.ts`
- [X] T013 Enhance WSAdapter: add heartbeat timer with start/stop lifecycle in `packages/thingsvis-kernel/src/datasources/WSAdapter.ts`
- [X] T014 Enhance WSAdapter: add initMessages sending on connect/reconnect in `packages/thingsvis-kernel/src/datasources/WSAdapter.ts`
- [X] T015 Run `pnpm typecheck --filter @thingsvis/kernel` to validate

### Reusable UI Components

- [X] T016 [P] Create KeyValueEditor component in `apps/studio/src/components/ui/KeyValueEditor.tsx` (add/edit/remove key-value pairs)
- [X] T017 [P] Create AuthSelector component in `apps/studio/src/components/ui/AuthSelector.tsx` (type selector with conditional inputs)
- [X] T018 [P] Create FormSection wrapper component in `apps/studio/src/components/ui/FormSection.tsx` (collapsible section with title)
- [X] T019 [P] Create JsonEditor component using CodeMirror in `apps/studio/src/components/ui/JsonEditor.tsx` (syntax highlighting + validation)

**Checkpoint**: Foundation ready - user story form implementation can now begin ✅

---

## Phase 3: User Story 1 - 配置带认证的 REST API (Priority: P1) 🎯 MVP

**Goal**: Allow users to configure REST API with Bearer Token/Basic Auth/API Key authentication, custom headers, and timeout

**Independent Test**: Open data source dialog → select REST type → configure Bearer Token auth + custom header → test connection → verify request headers contain Authorization and custom header

### Implementation for User Story 1

- [X] T020 [US1] Create HeadersSection component in `apps/studio/src/widgets/DataSourceConfig/sections/HeadersSection.tsx` using KeyValueEditor
- [X] T021 [US1] Create AuthSection component in `apps/studio/src/widgets/DataSourceConfig/sections/AuthSection.tsx` using AuthSelector
- [X] T022 [US1] Create TimeoutSection component in `apps/studio/src/widgets/DataSourceConfig/sections/TimeoutSection.tsx` (number input with 1-300 range)
- [X] T023 [US1] Refactor RESTForm to use section layout in `apps/studio/src/widgets/DataSourceConfig/RESTForm.tsx` - integrate HeadersSection, AuthSection, TimeoutSection
- [X] T024 [US1] Add form validation for required fields (URL) and timeout range in RESTForm
- [X] T025 [US1] Update "Test Connection" logic to use enhanced RESTAdapter with auth/headers/timeout

**Checkpoint**: REST API with authentication configuration fully functional - User Story 1 complete ✅

---

## Phase 4: User Story 2 - 配置 POST/PUT 请求体 (Priority: P1)

**Goal**: Allow users to configure request body for POST/PUT requests with JSON validation

**Independent Test**: Select POST method → body section appears → enter JSON → validation shows errors for invalid JSON → test connection sends correct body

### Implementation for User Story 2

- [X] T026 [US2] Create BodySection component in `apps/studio/src/widgets/DataSourceConfig/sections/BodySection.tsx` using JsonEditor with real-time validation
- [X] T027 [US2] Integrate BodySection into RESTForm with conditional visibility (show only for POST/PUT) in `apps/studio/src/widgets/DataSourceConfig/RESTForm.tsx`
- [X] T028 [US2] Add JSON validation error display in BodySection (parse error message from Zod/JSON.parse)
- [X] T029 [US2] Update RESTAdapter to send body with Content-Type: application/json in `packages/thingsvis-kernel/src/datasources/RESTAdapter.ts`

**Checkpoint**: REST form now supports full request body configuration - User Story 2 complete ✅

---

## Phase 5: User Story 3 - 配置 WebSocket 重连策略 (Priority: P1)

**Goal**: Allow users to configure WebSocket reconnection with max attempts, intervals, and exponential backoff

**Independent Test**: Configure WS with reconnect enabled → set max 3 attempts, 2s interval, exponential backoff → disconnect network → observe reconnection at 2s, 4s, 8s intervals

### Implementation for User Story 3

- [X] T030 [US3] Create ReconnectSection component in `apps/studio/src/widgets/DataSourceConfig/sections/ReconnectSection.tsx` (enabled switch, maxAttempts, initialInterval, exponentialBackoff toggle, maxInterval)
- [X] T031 [US3] Refactor WSForm to use section layout in `apps/studio/src/widgets/DataSourceConfig/WSForm.tsx` - integrate ReconnectSection
- [X] T032 [US3] Add form validation for reconnect config (ranges: maxAttempts 0-100, intervals valid numbers)
- [X] T033 [US3] Add connection status display showing current reconnect attempt count in WSForm

**Checkpoint**: WebSocket reconnection configuration fully functional - User Story 3 complete ✅

---

## Phase 6: User Story 4 - 配置 WebSocket 心跳保活 (Priority: P2)

**Goal**: Allow users to configure heartbeat keep-alive with interval and custom message content

**Independent Test**: Enable heartbeat → set 10s interval → set message `{"type":"ping"}` → connect → observe heartbeat messages every 10s in network tab

### Implementation for User Story 4

- [X] T034 [US4] Create HeartbeatSection component in `apps/studio/src/widgets/DataSourceConfig/sections/HeartbeatSection.tsx` (enabled switch, interval, message input)
- [X] T035 [US4] Integrate HeartbeatSection into WSForm in `apps/studio/src/widgets/DataSourceConfig/WSForm.tsx`
- [X] T036 [US4] Add form validation for heartbeat config (interval 5-300 range)

**Checkpoint**: WebSocket heartbeat configuration fully functional - User Story 4 complete ✅

---

## Phase 7: User Story 5 - 配置 WebSocket 初始订阅消息 (Priority: P2)

**Goal**: Allow users to configure messages to send immediately after WebSocket connection

**Independent Test**: Add 2 init messages → connect → observe both messages sent in order immediately after connection

### Implementation for User Story 5

- [X] T037 [US5] Create InitMessagesSection component in `apps/studio/src/widgets/DataSourceConfig/sections/InitMessagesSection.tsx` (list with add/remove, each item is a textarea)
- [X] T038 [US5] Integrate InitMessagesSection into WSForm in `apps/studio/src/widgets/DataSourceConfig/WSForm.tsx`
- [X] T039 [US5] Add ordering controls (move up/down) for init messages in InitMessagesSection

**Checkpoint**: WebSocket init messages configuration fully functional - User Story 5 complete ✅

---

## Phase 8: User Story 6 - 配置 WebSocket 子协议 (Priority: P3)

**Goal**: Allow users to configure WebSocket subprotocols for special server requirements

**Independent Test**: Configure protocols `graphql-ws, subscriptions-transport-ws` → connect → verify Sec-WebSocket-Protocol header in network tab

### Implementation for User Story 6

- [X] T040 [US6] Create ProtocolsSection component in `apps/studio/src/widgets/DataSourceConfig/sections/ProtocolsSection.tsx` (comma-separated input or tag input)
- [X] T041 [US6] Integrate ProtocolsSection into WSForm in `apps/studio/src/widgets/DataSourceConfig/WSForm.tsx`

**Checkpoint**: WebSocket subprotocols configuration fully functional - User Story 6 complete ✅

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T042 [P] Add i18n support for all new form labels (zh/en) in section components
- [X] T043 [P] Add edge case handling: auth header conflict warning when user adds Authorization manually in HeadersSection
- [X] T044 Code cleanup: ensure consistent styling across all section components
- [X] T045 Update DataSourceDialog to properly initialize default values for new fields in `apps/studio/src/components/Modals/DataSourceDialog.tsx`
- [X] T046 Update DataSourcesPage to properly initialize default values in `apps/studio/src/pages/DataSourcesPage.tsx`
- [ ] T047 Run quickstart.md validation - test all acceptance scenarios manually
- [X] T048 Run `pnpm typecheck` for full workspace validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - P1 stories (US1, US2, US3) should be prioritized
  - P2 stories (US4, US5) can follow
  - P3 story (US6) is lowest priority
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - REST auth/headers/timeout
- **User Story 2 (P1)**: Can start after Foundational - REST body (can parallel with US1)
- **User Story 3 (P1)**: Can start after Foundational - WS reconnect (can parallel with US1/US2)
- **User Story 4 (P2)**: Depends on US3 being in WSForm - WS heartbeat
- **User Story 5 (P2)**: Can parallel with US4 - WS init messages
- **User Story 6 (P3)**: Can parallel with US4/US5 - WS protocols

### Within Each Phase

- Schema tasks T001-T003 can run in parallel (different files)
- UI component tasks T016-T019 can run in parallel (different files)
- Form section tasks within each user story are generally sequential (same form file integration)

### Parallel Opportunities

```bash
# Phase 1: Schema layer parallel tasks
T002 [P] ReconnectPolicySchema (reconnect-config.ts)
T003 [P] HeartbeatConfigSchema (heartbeat-config.ts)

# Phase 2: UI components parallel tasks
T016 [P] KeyValueEditor (KeyValueEditor.tsx)
T017 [P] AuthSelector (AuthSelector.tsx)
T018 [P] FormSection (FormSection.tsx)
T019 [P] JsonEditor (JsonEditor.tsx)

# User Stories: REST and WS form work can be parallel
US1/US2 (REST form enhancements) || US3/US4/US5/US6 (WS form enhancements)
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 3)

1. Complete Phase 1: Setup (Schema)
2. Complete Phase 2: Foundational (Kernel + Base UI)
3. Complete Phase 3-5: User Stories 1, 2, 3 (all P1 priority)
4. **STOP and VALIDATE**: Test REST with auth/body/timeout, WS with reconnect
5. Deploy/demo if ready - this covers most enterprise use cases

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → REST auth works → Demo
3. Add User Story 2 → REST body works → Demo
4. Add User Story 3 → WS reconnect works → Demo (MVP complete!)
5. Add User Story 4 → WS heartbeat works
6. Add User Story 5 → WS init messages works
7. Add User Story 6 → WS protocols works (Full feature complete)

### Parallel Team Strategy

With 2 developers:

1. Both complete Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Stories 1 + 2 (REST form enhancements)
   - Developer B: User Stories 3 + 4 + 5 + 6 (WS form enhancements)
3. Stories complete and merge independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All new schema fields use `.optional()` with `.default()` for backward compatibility
