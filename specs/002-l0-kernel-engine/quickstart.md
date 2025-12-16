# Quickstart: Phase 2 - L0 Kernel Engine (Headless, Leafer UI)

**Goal**: Build and run the preview app to validate the headless kernel engine rendering 1000+ nodes with React Bypass, undo/redo, and error isolation.

## 1) Install dependencies (root)

```bash
pnpm install
```

## 2) Build libraries with Rspack (order matters)

```bash
pnpm build --filter ./packages/thingsvis-schema
pnpm build --filter ./packages/thingsvis-utils
pnpm build --filter ./packages/thingsvis-kernel
pnpm build --filter ./packages/thingsvis-ui
```

## 3) Run the preview app (Rspack)

```bash
pnpm dev --filter ./apps/preview
```

Then open the URL printed by the dev server (typically `http://localhost:3000`).

## 4) Validate the demo

1) **Render 1000 nodes**: The canvas shows 1000 rectangles from the demo schema.  
2) **Selection**: Clicking a rectangle marks it selected in the kernel store (check selection state/console).  
3) **Undo/Redo**: Trigger selection or movement, press Undo/Redo (keyboard or UI control), and verify state/visuals revert/advance.  
4) **Error isolation**: Trigger the intentional failing component—only that component shows a fallback; the rest of the scene continues to work.  
5) **Performance feel**: Panning/zooming and selection feel smooth (target subjective 60 FPS).


