# Quickstart: Integrate Canvas Kernel into `apps/studio`

1. Install and build kernel/UI packages:

```bash
pnpm -w install
pnpm -w build # or use Turborepo pipeline
```

2. Add `CanvasView` to Studio
- Import `CanvasView` from `packages/thingsvis-ui` (VisualEngine wrapper).
- Mount in Studio's page editor component and pass `pageId` and `pageSchema`.

3. Provide store and event wiring
- Ensure `packages/thingsvis-kernel` is initialized and exposes `getPage`, `action.*`, and `subscribeToPatches`.
- Pass store callbacks to `CanvasView` props for selection and plugin events.

4. Debugging & profiling
- Use the provided fixtures in `specs/003-canvas-kernel/fixtures/` (Phase1) to benchmark 1k/5k/10k nodes.
- Enable VisualEngine debug overlays (spatial index, dirty counts) to profile expensive nodes.

5. Notes
- Ensure plugin components are wrapped in `HeadlessErrorBoundary` from `thingsvis-ui`.
- For heavy ingestion, route ETL through the provided worker entry (see `packages/thingsvis-kernel/src/etl-worker.ts`).


