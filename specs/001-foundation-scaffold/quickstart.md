# Quickstart: Foundation Scaffold

## Prerequisites

- pnpm 8+ installed (`pnpm -v` to verify).
- Node.js 18+ recommended.

## Install

```bash
pnpm install
```

## Common Commands

- Root typecheck/build via turbo:

```bash
pnpm typecheck
pnpm build
```

- Package builds:

```bash
pnpm build --filter @thingsvis/schema
pnpm build --filter @thingsvis/kernel
pnpm build --filter @thingsvis/ui
```

- Studio app:

```bash
pnpm dev --filter ./apps/studio
pnpm build --filter ./apps/studio
```

## Notes

- Workspace packages are linked with `"workspace:*"` versions.
- Rsbuild (Rspack) powers `apps/studio`; TailwindCSS is configured via PostCSS.
- Zod schemas live in `packages/thingsvis-schema`; kernel is UI-free in `packages/thingsvis-kernel`.

