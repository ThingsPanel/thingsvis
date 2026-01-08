# Implementation Plan: Delete Selected Nodes via Delete Key

**Branch**: `001-delete-selected-nodes` | **Date**: 2026-01-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-delete-selected-nodes/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement the existing `edit.delete` keyboard shortcut so it deletes the current selection in the Studio canvas, does nothing when nothing is selected, and participates in the existing undo/redo history.

Approach:
- Extend the Studio default command registration to include `edit.delete`.
- Provide Editor → command dependencies using the shared kernel store (`store`).
- Filter out locked nodes and rely on kernel store temporal history for undo/redo.
- Keep keyboard handling safe around inputs (already handled) and normalize Backspace→Delete for macOS ergonomics.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.3.x  
**Primary Dependencies**: React 18, Zustand (vanilla store), zundo (temporal history), Rsbuild  
**Storage**: N/A (this feature is in-memory editing; persistence handled elsewhere)  
**Testing**: Manual QA (Studio) + `pnpm -w turbo run typecheck --filter=studio`; optional unit test only if a test runner is already configured  
**Target Platform**: Browser (Windows/macOS/Linux)  
**Project Type**: Web application (monorepo; feature lives in `apps/studio`)  
**Performance Goals**: Keep interactive edits responsive (no noticeable lag on delete)  
**Constraints**: Do not modify `packages/thingsvis-kernel` or `packages/thingsvis-schema`; implement in Studio command layer  
**Scale/Scope**: Delete up to ~200 selected nodes within ~200ms interactive budget

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Status: PASS

- Micro‑Kernel & Separation: PASS (changes only in Studio command/UI layer).
- Schema‑First Contracts: PASS (no persisted schema changes required).
- Type Safety: PASS (keep strict typing; avoid `any` in new command deps).
- Backward Compatibility: PASS (no change to stored project format).
- Simplicity & Performance: PASS (small, targeted change).
- Plugin Independence: PASS (not a plugin feature).

Re-check after Phase 1 design: PASS

## Project Structure

### Documentation (this feature)

```text
specs/001-delete-selected-nodes/
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
└── studio/
  ├── src/
  │   ├── components/
  │   │   └── Editor.tsx
  │   └── lib/
  │       └── commands/
  │           ├── constants.ts
  │           ├── defaultCommands.ts
  │           └── useKeyboardShortcuts.ts
  └── package.json

packages/
└── thingsvis-kernel/
  └── src/store/KernelStore.ts  # API reference only; no edits
```

**Structure Decision**: Implement entirely in `apps/studio` by extending the command system and wiring it to the shared kernel store instance.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

## Phase 0: Research Output

- See [research.md](research.md) for confirmed APIs and key decisions.

## Phase 1: Design & Contracts

### Data model

- See [data-model.md](data-model.md).

### Contracts

- Command behavior contract: [contracts/commands.openapi.yaml](contracts/commands.openapi.yaml)

## Phase 2: Implementation Planning (for `/speckit.tasks`)

Planned code changes (no code written in this phase):

1) Add delete dependencies and register `edit.delete`
  - Update `DefaultCommandsDependencies` to include:
    - `getKernelState: () => KernelState`
    - `deleteNodes: (ids: string[]) => void`
  - In `createDefaultCommands`, register a new edit command:
    - `id = COMMAND_IDS.EDIT_DELETE`
    - `execute`: read selection from `getKernelState()`, filter locked, call `deleteNodes`.
    - `when`: enabled only when there exists at least one selected unlocked node.

2) Wire dependencies from the Studio editor
  - In `Editor.tsx`, pass:
    - `getKernelState: () => store.getState()`
    - `deleteNodes: (ids) => store.getState().removeNodes(ids)`

3) Make Delete ergonomic across platforms
  - In `useKeyboardShortcuts.ts`, normalize `backspace` → `delete` for shortcut matching when not in an input field.

4) Validate against acceptance scenarios
  - Use [quickstart.md](quickstart.md) manual QA checklist.
