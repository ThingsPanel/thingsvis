# Contract: `vis-cli`

**Feature**: Phase 3 — Component Ecosystem (L1)  
**Date**: 2025-12-17

## Purpose

Provide a minimal CLI to scaffold a new plugin package in `plugins/` following the “7 Categories” taxonomy.

## Command

```bash
pnpm vis-cli create <category> <name>
```

## Inputs

- `category`: one of the allowed categories (e.g., `basic`, `layout`, `media`, `custom`, …)
- `name`: short kebab-case plugin name (e.g., `rect`, `text`, `cyber-clock`)

## Output (filesystem)

Creates:

```text
plugins/<category>/<name>/
├── package.json
├── rspack.config.js
├── src/
│   ├── index.ts
│   └── spec.tsx
└── README.md
```

## Behavior

- If the target directory already exists, the CLI fails fast with a clear message.
- The generated plugin includes:
  - MF `./Main` exposure via `src/index.ts`
  - A `spec.tsx` visual test that renders the component in isolation


