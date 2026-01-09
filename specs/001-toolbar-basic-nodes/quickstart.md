# Quickstart: Studio Toolbar Basic Tools

**Feature**: [spec.md](spec.md)
**Date**: 2026-01-09

## Prerequisites

- Node.js 18+
- pnpm

## Run (Studio)

- Install deps: `pnpm install`
- Start Studio: `pnpm dev --filter ./apps/studio`

If you add new plugins for this feature, ensure their static build outputs are available for Studio registry entries.

## Manual QA Checklist

### P1: Rectangle / Circle creation

1. Select Rectangle tool (toolbar).
2. Drag on canvas → preview shows during drag → release creates rectangle.
3. Verify the created rectangle is selected.
4. Without re-selecting tool, drag again → a second rectangle is created.
5. Select Circle tool.
6. Click on canvas (no drag) → creates a circle with default size and selects it.
7. Start dragging to create, then press Escape before release → no new node is added.

### P2: Text creation

1. Select Text tool.
2. Click on canvas → creates `basic/text` and selects it.
3. Update text content via the standard property panel → canvas text updates.

### P3: Image creation

1. Select Image tool.
2. Choose an image file in the picker.
3. Click or drag on the canvas → creates `media/image` and selects it.
4. Undo → image node is removed.
5. Cancel the picker → no node is created.

### Categorization

1. Open the component library panel.
2. Verify `basic/rectangle`, `basic/circle`, `basic/text` appear under Basic.
3. Verify `media/image` appears under Media.

## Quality Gates

- `pnpm -w turbo run typecheck --filter=studio`
