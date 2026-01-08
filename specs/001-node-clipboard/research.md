# Phase 0 Research: Copy, Paste, Duplicate Nodes

**Feature**: [spec.md](spec.md)  
**Branch**: `001-node-clipboard`  
**Date**: 2026-01-08

## Findings

### Existing Studio command + shortcut system

**Decision**: Use the existing Studio command system (`commandRegistry`, `registerDefaultCommands`, `useKeyboardShortcuts`).

**Rationale**:
- Command IDs for `edit.copy` and `edit.paste` already exist in the built-in constants.
- `useKeyboardShortcuts` already:
  - Normalizes `mod` to Ctrl/⌘.
  - Ignores shortcuts while typing in input/textarea/contenteditable.
  - Calls `preventDefault()` to suppress browser defaults for registered shortcuts.

**Alternatives considered**:
- Ad-hoc `window.onkeydown` handlers in the Editor component: rejected (duplicates infra and becomes harder to reason about enable/disable conditions).

---

### Clipboard storage scope

**Decision**: Implement an internal, in-memory clipboard module for the Studio session.

**Rationale**:
- Meets requirements (copy/paste/duplicate) without involving OS clipboard complexities.
- Keeps implementation small and avoids cross-tab/cross-app edge cases.

**Alternatives considered**:
- OS clipboard integration (`navigator.clipboard`): rejected (permissions, browser differences, and not required).
- `localStorage` persistence: deferred (not required by spec; would add cross-project ambiguity).

---

### Unique ID generation for pasted/duplicated nodes

**Decision**: Generate new node IDs using `crypto.randomUUID()` when available, with a deterministic fallback.

**Rationale**:
- Strong collision resistance.
- Already used in Studio for project IDs and other tokens.

**Alternatives considered**:
- Reusing existing `node-${type}-${Date.now()}` patterns: rejected (higher collision risk, especially for multi-node paste).
- Adding a new dependency (e.g., `nanoid`): rejected (unnecessary).

---

### Deterministic paste offsets

**Decision**: Track a `pasteCount` that resets on Copy. Each Paste/Duplicate applies an offset of $(20n, 20n)$ where $n$ is the 1-based paste count since last Copy.

**Rationale**:
- Matches requirement for deterministic offset and “increasing per paste”.
- Simple to test.

**Alternatives considered**:
- Offset based on viewport center or cursor location: rejected (not specified).

---

### Locked node policy

**Decision**: Allow copying locked nodes, but ensure pasted/duplicated nodes are unlocked.

**Rationale**:
- Kernel node lock is stored in runtime `NodeState.locked` (not in `NodeSchemaType`).
- New nodes created via kernel `addNodes` default to unlocked unless explicitly locked.

**Alternatives considered**:
- Prevent copying locked nodes: rejected (spec says copy allowed).

---

### Undo/redo behavior and selection restoration

**Key discovery**: Kernel temporal history ignores *selection-only* changes.
- Kernel store uses zundo with a filter that excludes deltas where the only change is `selection`.
- This means a naive implementation (`addNodes()` then `selectNodes()`) would:
  - Undo correctly removes pasted nodes.
  - Redo re-adds nodes but may *not* reselect them (because selection change wasn’t captured in the redoable history entry).

**Decision**: Make Paste/Duplicate an atomic edit from the history perspective by updating node creation and selection within the same state change.

**Rationale**:
- Ensures redo restores both nodes and the intended “pasted nodes become selection” state.

**Alternatives considered**:
- Accept redo without re-selection: rejected (conflicts with spec expectations for selection behavior).

---

## Summary of Decisions

- Use existing Studio command system.
- Keep clipboard in-memory (per session).
- Generate IDs via `crypto.randomUUID()` (+ fallback).
- Deterministic offset via paste counter, reset on Copy.
- Copy locked nodes; pasted/duplicated nodes are unlocked.
- Ensure Paste/Duplicate is a single undoable operation including selection.
