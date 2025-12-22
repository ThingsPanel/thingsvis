# quickstart.md — Dual Canvas Modes

## Prerequisites

- Node 20+ and pnpm installed.  
- From repo root:
  - `pnpm install`

## Local dev (Studio)

1. Start the studio app:
   - `pnpm --filter apps/studio dev`
2. Start the preview app (optional):
   - `pnpm --filter apps/preview dev`

## How to test Dual Canvas Modes

1. Open `apps/studio` in the browser.  
2. In the left panel, use the mode toggle to switch `Fixed` vs `Infinite`.  
   - Fixed: set width/height in canvas settings (defaults: `1920x1080`) → observe centered mask.  
   - Infinite: enable `grid` and `snapToGrid` to test dragging and snapping behavior.  
3. Drag a component from the material panel into canvas; inspect `nodes` in the store to verify NodeSchema instantiation.  
4. Use Moveable controls to move/resize/rotate; verify that `CmdStack` receives commands and that Undo/Redo (Ctrl+Z / Ctrl+Shift+Z) work for at least 50 steps.

## Developer notes

- Enforce imports via `@thingsvis/*`. Add a lint rule to block relative imports into `packages/thingsvis-ui/src`.  
- Wrap registry renderers with `HeadlessErrorBoundary` for every render.  
- Keep per-frame logic out of React render paths — prefer store listeners that update Leafer layers directly.


