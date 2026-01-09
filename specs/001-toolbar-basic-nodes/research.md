# Phase 0 Research: Studio Toolbar Basic Tools

**Feature**: [spec.md](spec.md)
**Date**: 2026-01-09

## Findings

### Existing Studio tool switching

- Decision: Reuse the existing `activeTool` state in the Studio editor and the existing command system (`tool.*` commands) for tool switching.
- Rationale:
  - The toolbar UI already lists `select`, `rectangle`, `circle`, `arrow`, `text`, `image`, `pan` in [apps/studio/src/components/Editor.tsx](../../apps/studio/src/components/Editor.tsx).
  - The command system already supports `tool.select`, `tool.rectangle`, `tool.text`, `tool.pan` in [apps/studio/src/lib/commands/constants.ts](../../apps/studio/src/lib/commands/constants.ts) and [apps/studio/src/lib/commands/defaultCommands.ts](../../apps/studio/src/lib/commands/defaultCommands.ts).
- Alternatives considered:
  - Add an entirely separate “tool state machine” outside the existing command system: rejected (duplicates state + makes shortcuts/tool buttons diverge).

### Existing canvas interaction surface

- Decision: Implement creation gestures as an overlay layer in `apps/studio/src/components/CanvasView.tsx` (or a child component under `components/tools/`) that uses the canvas container + viewport to translate screen events into world coordinates.
- Rationale:
  - `CanvasView` already owns the viewport (zoom/offset) and exposes it via state, and already has selection clearing and DnD node creation.
  - World coord conversion is already handled in-place today for DnD (based on `vp.zoom/offsetX/offsetY`).
- Alternatives considered:
  - Put creation logic in kernel: rejected (violates micro-kernel separation; tool UI is host concern).
  - Attach global `window` listeners (like `ConnectionTool`): possible but rejected for creation tools (harder to scope events to canvas; higher risk of interfering with other UI).

### Node creation + undo/redo

- Decision: Create nodes through the kernel store in a way that results in a single history entry for “create + select”.
- Rationale:
  - `store.getState().addNodes([node])` exists and is used today, but selection-after-create is not guaranteed.
  - The editor already has an “atomic insert+select” pattern for paste/duplicate by using a single `store.setState(...)` update that modifies `nodesById`, `layerOrder`, and `selection` together.
- Alternatives considered:
  - Call `addNodes` then `selectNode` separately: rejected (may create two history steps and violates FR-016/FR-017 intent).

### Component catalog categorization (basic vs media)

- Decision: Drive categorization by component id prefix in registry (`basic/*`, `media/*`), consistent with the existing component library.
- Rationale:
  - `ComponentsList` groups entries by prefix of `displayName` / registry key, e.g. `basic/text` → “basic” category.
  - Studio registry currently already uses `basic/text` (and other keys) in [apps/studio/public/registry.json](../../apps/studio/public/registry.json).
- Alternatives considered:
  - Add a second categorization system independent of registry keys: rejected (would drift and require more UI wiring).

### Image asset input (MVP)

- Decision: For MVP, accept local image upload via file picker and store the image as a data URL in node props.
- Rationale:
  - Project persistence uses IndexedDB and stores full node props; data URLs keep the feature self-contained and compatible with export/import.
  - No existing asset library/manager is present in Studio today.
- Alternatives considered:
  - Store object URLs (`blob:`) in props: rejected (not persistent across reload).
  - Store external URLs only: rejected for MVP (does not satisfy “choose asset” in offline/local workflows).

## Competitor-Inspired Interaction Model (generalized)

This plan follows common canvas-editor conventions (Figma/Miro/Excalidraw-like), without copying any proprietary UI:

- Tool is “sticky” (remains active) so repeated creation is fast.
- Drag creates bounds-based geometry; click creates a reasonable default size.
- Escape cancels an in-progress creation gesture.
- Live preview is shown during drag.

## Decisions Summary

- Implement creation as a `CreateToolLayer` under Studio canvas, routing pointer gestures by `activeTool`.
- Add missing tool commands for circle/image (tool switching), but keep creation behavior separate from commands.
- Add core plugins and registry entries:
  - `basic/rectangle`, `basic/circle`, `media/image`.
- Store uploaded image content as data URL in props for MVP.

## Testing Approach

- Primary validation: manual QA checklist in [quickstart.md](quickstart.md)
- Quality gate: `pnpm -w turbo run typecheck --filter=studio`
