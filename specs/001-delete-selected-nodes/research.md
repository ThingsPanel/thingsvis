# Phase 0 Research: Delete Selected Nodes via Delete Key

**Feature**: [spec.md](spec.md)
**Date**: 2026-01-08

## Findings

### Existing command + shortcut system

- Decision: Use the existing Studio command system (`commandRegistry`, `registerDefaultCommands`, `useKeyboardShortcuts`).
- Rationale: The shortcut (`edit.delete` → `['delete']`) is already defined in [apps/studio/src/lib/commands/constants.ts](../../apps/studio/src/lib/commands/constants.ts). The hook already:
  - Normalizes keys to lowercase.
  - Prevents firing shortcuts while typing in inputs/contenteditable (except Escape).
- Alternatives considered:
  - Add ad-hoc `window.onkeydown` inside the editor: rejected (duplicates infra, harder to test).

### Where deletion must be performed

- Decision: Delete should call the kernel store’s `removeNodes(nodeIds)` action.
- Rationale:
  - The Studio uses a shared kernel store instance (`store = createKernelStore()`).
  - The kernel store implements `removeNodes` and updates selection and layer order in one place.
- Alternatives considered:
  - Deleting by mutating local React state: rejected (single source of truth is kernel store).

### Undo/redo integration

- Decision: Rely on kernel store temporal history (`zundo` middleware) for undo/redo.
- Rationale: The kernel store is created with `temporal(...)` middleware; the Studio already uses `store.temporal.getState().undo/redo()`.
- Alternatives considered:
  - Implement separate history stack for delete: rejected (would diverge from existing history system).

### Locked node behavior

- Decision: Filter selected ids by `!state.nodesById[id]?.locked` before deletion.
- Rationale:
  - Node locked state is tracked in kernel `NodeState.locked`.
  - Studio already respects `locked` for transforms and layer panel operations.
- Alternatives considered:
  - Delete everything including locked: rejected (conflicts with spec + existing UX expectations).

### Cross-platform key behavior (Delete vs Backspace)

- Decision: Keep `['delete']` as the canonical shortcut and add a small normalization so `Backspace` can also trigger delete when the canvas is focused.
- Rationale:
  - On macOS keyboards, the key users expect for “delete” often emits `event.key === 'Backspace'`.
  - The current command model supports only a single shortcut per command (`ShortcutKey[]`), so adding a second binding is not possible without expanding the command contract.
- Alternatives considered:
  - Expand `Command.shortcut` to support multiple shortcuts: rejected for this P0 (larger refactor).
  - Make `DEFAULT_SHORTCUTS[edit.delete]` platform-dependent at runtime: possible but unnecessary if normalization handles it.

## Decisions Summary

- Implement `edit.delete` in Studio default commands (`apps/studio/src/lib/commands/defaultCommands.ts`).
- Wire dependencies from the Studio editor component (`apps/studio/src/components/Editor.tsx`).
- Use `store.getState()` for state read and `store.getState().removeNodes(...)` for mutation.
- Filter out locked nodes before deletion.
- Ensure shortcut does not interfere with text inputs (already handled).
- Add Backspace→Delete normalization in the shortcut handler for macOS-friendly behavior.

## Testing Approach

- Primary validation: manual QA checklist in [quickstart.md](quickstart.md)
- Quality gate: `pnpm -w turbo run typecheck --filter=studio`
