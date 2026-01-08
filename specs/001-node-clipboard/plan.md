# Implementation Plan: Copy, Paste, Duplicate Nodes

**Branch**: `001-node-clipboard` | **Date**: 2026-01-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-node-clipboard/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement the existing Copy/Paste shortcuts and add a Duplicate shortcut so users can quickly copy, paste, and duplicate selected nodes in the Studio canvas.

Key behaviors:
- Copy stores a serialized clipboard of selected nodes (no selection → no-op).
- Paste creates new nodes with new ids, preserving relative layout and applying a deterministic offset of (+20px, +20px) per paste since last copy.
- Duplicate creates new nodes from the current selection in one step (equivalent to paste-from-selection) and uses the same deterministic offset behavior.
- Paste/Duplicate are undoable and redoable.

Approach:
- Extend the Studio command layer (`defaultCommands.ts`) with `edit.copy`, `edit.paste`, and `edit.duplicate`.
- Add a small Studio-only clipboard utility module.
- Wire command dependencies in `Editor.tsx` using the shared kernel store.
- Ensure undo/redo correctness by making paste/duplicate a single history-visible edit that includes both node creation and selection updates.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.3.x  
**Primary Dependencies**: React 18, Zustand (vanilla store), zundo (temporal history), Rsbuild  
**Storage**: N/A (clipboard is in-memory for this feature; persistence handled elsewhere)  
**Testing**: Manual QA (Studio) + `pnpm -w turbo run typecheck --filter=studio`  
**Target Platform**: Browser (Windows/macOS/Linux)  
**Project Type**: Web application (monorepo; feature lives in `apps/studio`)  
**Performance Goals**: Keep interactive edits responsive; copy/paste/duplicate up to ~200 nodes within an interactive budget (~200ms)  
**Constraints**: Implement in Studio; do not modify `packages/thingsvis-kernel` or `packages/thingsvis-schema`  
**Scale/Scope**: Studio canvas with many nodes; operations should be linear in selection size

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Status: PASS

- Micro‑Kernel & Separation: PASS (Studio-only command/clipboard wiring).
- Schema‑First Contracts: PASS (no persisted schema changes).
- Type Safety: PASS (no new `any` in shared contracts; keep typings explicit in Studio deps).
- Backward Compatibility: PASS (no change to stored project format).
- Simplicity & Performance: PASS (small, targeted feature).
- Plugin Independence: PASS (not a plugin feature).

Re-check after Phase 1 design: PASS

## Project Structure

### Documentation (this feature)

```text
specs/001-node-clipboard/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/
└── studio/
  ├── src/
  │   ├── components/
  │   │   └── Editor.tsx
  │   └── lib/
  │       ├── clipboard.ts            # new
  │       └── commands/
  │           ├── constants.ts        # add edit.duplicate
  │           └── defaultCommands.ts  # implement copy/paste/duplicate commands
  └── package.json

packages/
└── thingsvis-kernel/
  └── src/store/KernelStore.ts  # API reference only; no edits
```

**Structure Decision**: Implement entirely in `apps/studio` by extending the existing command system and wiring it to the shared kernel store instance.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations identified for this feature.

## Phase 0: Research Output

- See [research.md](research.md) for confirmed APIs and key decisions (notably undo/redo + selection behavior).

## Phase 1: Design & Contracts

### Data model

- See [data-model.md](data-model.md).

### Contracts

- Command behavior contract: [contracts/commands.openapi.yaml](contracts/commands.openapi.yaml)

## Phase 1: Quickstart

- Manual QA steps: [quickstart.md](quickstart.md)

## Phase 2: Implementation Planning (for `/speckit.tasks`)

Planned code changes (no code written in this phase):

1) Add `edit.duplicate` command id + shortcut
  - Update `apps/studio/src/lib/commands/constants.ts`:
    - Add `COMMAND_IDS.EDIT_DUPLICATE = 'edit.duplicate'`
    - Add `DEFAULT_SHORTCUTS[COMMAND_IDS.EDIT_DUPLICATE] = ['mod','d']`

2) Implement clipboard utility module
  - Create `apps/studio/src/lib/clipboard.ts`:
    - Store `ClipboardPayload | null`
    - Track `pasteCountSinceCopy` (reset on successful Copy)
    - Provide helpers:
      - `copyNodes(nodes: NodeSchemaType[]): void`
      - `readClipboard(): ClipboardPayload | null`
      - `nextPasteOffset(): { dx: number; dy: number; n: number }` (increments counter)
      - `makePastedNodes(payload, {dx,dy}): NodeSchemaType[]` (new ids + offset)

3) Extend default command dependencies
  - In `apps/studio/src/lib/commands/defaultCommands.ts`, extend `DefaultCommandsDependencies` with:
    - `getKernelState: () => KernelState`
    - `applyNodeInsertAndSelect: (nodes: NodeSchemaType[], selectIds: string[]) => void`
      - This is intentionally atomic to ensure undo/redo captures both node creation and selection.

4) Register edit.copy / edit.paste / edit.duplicate
  - `edit.copy`:
    - Read selection from `getKernelState().selection.nodeIds`.
    - If empty → no-op (clipboard preserved).
    - Else serialize selected `schemaRef` nodes and call `copyNodes`.

  - `edit.paste`:
    - If clipboard empty → no-op.
    - Else increment paste counter, materialize new nodes with new ids and offset, then call `applyNodeInsertAndSelect(newNodes, newIds)`.

  - `edit.duplicate`:
    - If selection empty → no-op.
    - Else increment paste counter, create new nodes from current selection, then call `applyNodeInsertAndSelect(newNodes, newIds)`.

5) Wire dependencies from the Studio editor
  - In `apps/studio/src/components/Editor.tsx`, pass:
    - `getKernelState: () => store.getState() as KernelState`
    - `applyNodeInsertAndSelect: (nodes, ids) => store.setState(state => { ...mutate nodesById/layerOrder...; state.selection.nodeIds = ids }, false)`
      - Use the same NodeState defaults as kernel `addNodes` for newly created nodes.

6) Validate against acceptance scenarios
  - Use [quickstart.md](quickstart.md) manual QA checklist.
