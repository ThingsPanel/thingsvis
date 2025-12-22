## Registry configuration for local development

When developing `apps/studio` and `apps/preview` together, configure the registry URL so the studio loads the preview registry at runtime.

Options:

- Environment variable (build-time): set `PREVIEW_REGISTRY_URL` when starting dev servers:
  - `PREVIEW_REGISTRY_URL=http://localhost:3000/registry.json pnpm --filter studio dev`
- Runtime setter (programmatic): call `setPreviewRegistryUrl(url)` exported by `@thingsvis/ui` early in app boot (e.g., in `apps/studio/src/main.tsx`) to point to preview's registry endpoint.

Fallbacks:
- If no preview registry is available, the UI loader will fall back to a built-in fixture to ensure components render in the left panel during development.

# Quickstart: Run studio with registry fixture and test DnD flow

1. Install dependencies:

```bash
pnpm install
pnpm -w rebuild
```

2. Start preview + studio (dev):

```bash
pnpm --filter @thingsvis/studio dev
pnpm --filter @thingsvis/preview dev
```

3. Use the included fixture `apps/preview/public/registry.json` as the registry source (local dev). Confirm the left panel shows listed components.

4. Test DnD:
- Open `apps/studio`, drag an item from left panel onto canvas, confirm the placeholder is replaced and the node appears.
- Trigger Undo (Ctrl/Cmd+Z) and ensure the node is removed (Kernel history snapshot equality).

5. Tests:
- Run kernel unit tests and e2e scenario for the misbehaving-plugin sandbox test (see `tests/plugins/misbehaving-plugin.spec.ts`).


