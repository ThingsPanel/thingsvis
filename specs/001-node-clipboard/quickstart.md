# Quickstart: Copy, Paste, Duplicate Nodes

**Feature**: [spec.md](spec.md)

## Goal

Enable copying, pasting, and duplicating selected canvas nodes via keyboard shortcuts:
- Copy: Ctrl/⌘+C
- Paste: Ctrl/⌘+V
- Duplicate: Ctrl/⌘+D

Pastes/duplicates apply deterministic offsets and participate in undo/redo.

## Run

- From repo root: `pnpm -w dev --filter=studio` (or your existing Studio dev command)
- Open Studio (typically `apps/studio`).

## Manual QA Checklist

1. **Copy single selection**
   - Add a node, select it, press Ctrl/⌘+C.
   - Expected: clipboard becomes non-empty (no visible change required).

2. **Paste with offset**
   - Press Ctrl/⌘+V once.
   - Expected: a new node appears offset by (+20, +20) from the copied node; new node is selected.

3. **Repeated paste offset increments**
   - Press Ctrl/⌘+V again.
   - Expected: another new node appears offset by (+40, +40) from the original copied node; the latest pasted set is selected.

4. **Duplicate selection**
   - Select an existing node (or multiple), press Ctrl/⌘+D.
   - Expected: a duplicated node/set is created with the next deterministic offset; duplicated node(s) are selected.

5. **Empty clipboard paste**
   - Reload Studio (or otherwise clear clipboard), then press Ctrl/⌘+V.
   - Expected: no-op; no errors.

6. **Multi-node relative layout**
   - Add 2+ nodes at distinct positions, multi-select them, press Ctrl/⌘+C then Ctrl/⌘+V.
   - Expected: pasted nodes preserve relative spacing and all are offset together.

7. **Locked-node policy**
   - Lock a node, select it (alone or in a group), press Ctrl/⌘+C then Ctrl/⌘+V.
   - Expected: pasted copy is unlocked.

8. **Undo/Redo**
   - After a paste/duplicate, press Ctrl/⌘+Z.
   - Expected: created nodes are removed.
   - Press Ctrl/⌘+Y.
   - Expected: nodes are re-created; the re-created nodes are selected.

9. **Input safety**
   - Focus an input field (rename field, JSON editor, etc.), press Ctrl/⌘+C or Ctrl/⌘+V.
   - Expected: text editing behavior only; canvas nodes are not affected.
