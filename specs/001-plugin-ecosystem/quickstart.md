# Quickstart — Phase 3: Component Ecosystem (L1)

**Branch**: `001-plugin-ecosystem`  
**Date**: 2025-12-17

## Prerequisites

- Node.js + pnpm workspace (repo root: `F:/coding/thingsvis`)

## 1) Install

```bash
pnpm install
```

## 2) Start the host app (Preview)

```bash
pnpm --filter preview dev
```

## 3) Run the CLI to scaffold a plugin

```bash
pnpm vis-cli create basic my-part
```

## 4) Build and serve a plugin remote

From the generated plugin directory:

```bash
pnpm dev
```

## 5) Add plugin to registry

Update the statically served `registry.json` to include the plugin’s `componentId` mapped to its `remoteEntry.js` URL and version.

## 6) Verify isolation render (visual test)

Open the plugin’s `spec.tsx` runner (or the host’s plugin-spec runner) and confirm:
- The component renders
- Failures do not crash the host
- Re-load works with network disabled after first load

## Offline verification (MVP)

1. Start `apps/preview` and one plugin dev server (e.g. `plugins/basic/rect`).
2. In the Preview UI, click **Load Spec** for that plugin once (to populate local cache).
3. Disable network in browser devtools.
4. Refresh Preview and click **Load Spec** again:
   - Previously loaded plugins should still load (from local cache).
   - Plugins never loaded before should show a non-fatal error.


