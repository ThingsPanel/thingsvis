# thingsvis Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-30

## Active Technologies
- TypeScript 5.3.x (strict), React 18 (Studio UI) + pnpm workspaces + Turbo; Zod; Rsbuild/Rspack; Zustand + Immer (+ zundo); Radix UI + Tailwind (007-widget-style)
- N/A (kernel store is in-memory; some packages use `idb-keyval` for persistence) (007-widget-style)
- TypeScript 5.x (strict mode) + React 18, Zod (schema validation), Zustand + Immer (state), CodeMirror (JSON editor) (009-datasource-form-config)
- N/A (配置持久化复用现有 DataSource 存储机制) (009-datasource-form-config)
- TypeScript 5.x, React 18.x (010-editor-core-features)
- IndexedDB via `idb-keyval` (project data) + localStorage (recent projects metadata) (010-editor-core-features)
- N/A (no new persistence layer; uses existing kernel state) (001-fix-transform-zoom)
- TypeScript 5.3.x + React 18, Zustand (vanilla store), zundo (temporal history), Rsbuild (001-delete-selected-nodes)
- N/A (this feature is in-memory editing; persistence handled elsewhere) (001-delete-selected-nodes)

- TypeScript 5.x (strict mode) (007-widget-style)

## Project Structure

```text
src/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.x (strict mode): Follow standard conventions

## Recent Changes
- 001-delete-selected-nodes: Added TypeScript 5.3.x + React 18, Zustand (vanilla store), zundo (temporal history), Rsbuild
- 001-fix-transform-zoom: Added TypeScript 5.x, React 18.x
- 010-editor-core-features: Added TypeScript 5.x, React 18.x


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
