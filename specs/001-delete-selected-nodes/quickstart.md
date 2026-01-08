# Quickstart: Delete Selected Nodes via Delete Key

**Feature**: [spec.md](spec.md)

## Goal

Enable deleting selected canvas nodes via the Delete key, with undo/redo support.

## Run

- From repo root: `pnpm -w dev --filter=studio` (or your existing Studio dev command)
- Open Studio (typically `apps/studio`).

## Manual QA Checklist

1. **Delete single selection**
   - Add a node, select it, press Delete.
   - Expected: node disappears.

2. **Delete multi-selection**
   - Add 2+ nodes, select multiple, press Delete.
   - Expected: all selected unlocked nodes disappear.

3. **No selection**
   - Ensure selection is empty, press Delete.
   - Expected: no visible changes; no errors.

4. **Undo/Redo**
   - After deleting nodes, press Ctrl/⌘+Z.
   - Expected: deleted nodes reappear exactly.
   - Press Ctrl/⌘+Y (or editor redo shortcut).
   - Expected: nodes are deleted again.

5. **Input safety**
   - Focus an input in the UI (e.g., rename field), press Delete.
   - Expected: text editing behavior only; canvas nodes are not deleted.

6. **Locked nodes (if supported)**
   - Lock a node via layer panel, select it, press Delete.
   - Expected: locked node remains.
