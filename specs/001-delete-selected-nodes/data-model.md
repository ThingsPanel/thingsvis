# Data Model: Delete Selected Nodes via Delete Key

**Feature**: [spec.md](spec.md)
**Date**: 2026-01-08

## Entities

### Command

Represents an executable editor action.

Fields:
- `id: string` (e.g., `edit.delete`)
- `label: string`
- `category: 'edit' | 'tool' | 'view' | 'project' | 'help'`
- `shortcut?: ShortcutKey[]`
- `when?: () => boolean` (enablement predicate)
- `execute: () => void | Promise<void`

Validation / invariants:
- `id` is unique in the registry.
- `shortcut` matching must be stable across platforms.

### Shortcut (Keybinding)

The keystroke sequence that triggers a command.

Fields:
- `keys: ShortcutKey[]` (e.g., `['delete']`)

Invariants:
- Does not trigger when the user is typing in an input/contenteditable element.

### Selection

Current canvas selection.

Fields:
- `nodeIds: string[]`

Invariants:
- All ids in `nodeIds` exist in `nodesById`.
- After deletion, selection must not reference removed nodes.

### NodeState

Runtime node wrapper stored in the kernel store.

Fields:
- `id: string`
- `schemaRef: NodeSchemaType` (persisted node data)
- `locked: boolean`
- `visible: boolean`

Invariants:
- If `locked === true`, destructive operations (like delete) should not remove it.

### History Entry

A reversible record in the temporal history.

Invariants:
- A delete operation must be reversible via undo/redo.
- Undo returns nodes to their previous state.

## Relationships

- `Command(edit.delete)` reads `Selection.nodeIds`.
- `Command(edit.delete)` reads `NodeState.locked` to compute deletable ids.
- `Command(edit.delete)` calls `KernelActions.removeNodes(deletableIds)`.
- The temporal history records the state mutation so undo/redo works.
