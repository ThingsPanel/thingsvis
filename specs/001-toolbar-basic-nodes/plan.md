# Implementation Plan: Studio Toolbar Basic Tools

**Branch**: `001-toolbar-basic-nodes` | **Date**: 2026-01-09 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-toolbar-basic-nodes/spec.md`

**Note**: This file is produced by `/speckit.plan`. It documents *what* will be changed and *why*, without writing production code.

## Summary

Add four first-class creation tools to the Studio toolbar and make them usable via click/drag on the canvas:

- Rectangle (basic)
- Circle (basic)
- Text (basic)
- Image (media)

Approach:

- Reuse the existing Studio “activeTool” state and command system for tool switching.
- Implement creation interactions as small, decoupled “tool behavior” modules under `apps/studio/src/components/tools/`.
- Create/extend core plugins:
  - Add new plugins for rectangle/circle under `plugins/basic/`.
  - Add a new image plugin under `plugins/media/`.
- Register the new components in `apps/studio/public/registry.json` so they show in the component catalog and can be resolved by the runtime.
- Ensure node creation + selection is atomic for undo/redo history.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.3.x  
**Primary Dependencies**: React 18, Zustand (kernel store), LeaferJS (render), Module Federation runtime  
**Storage**: IndexedDB (project persistence via `idb-keyval`); images will be stored in node props for MVP (data URL)  
**Testing**: Manual QA (Studio) + `pnpm -w turbo run typecheck --filter=studio`; plugin build/typecheck as needed  
**Target Platform**: Browser (Windows/macOS/Linux)  
**Project Type**: Web application (monorepo; feature spans `apps/studio` + `plugins/*`)  
**Performance Goals**: Keep interactive edits responsive (preview updates while dragging; no noticeable lag for creation)  
**Constraints**: Respect micro-kernel boundaries (no UI deps in kernel); keep new abstractions minimal; plugins must remain independent (no imports from `@thingsvis/*` internals)  
**Scale/Scope**: MVP supports single-element creation gestures; no advanced asset library or editing tools

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Status: PASS (pre-design)

- Micro‑Kernel & Separation: PASS (tool UI + gestures live in `apps/studio`; plugins are separate packages).
- Schema‑First Contracts: PASS (no persistence schema changes required for MVP; image data stored in existing node props).
- Type Safety: PASS (keep strict typing; avoid `any` in new cross-module contracts).
- Backward Compatibility: PASS (existing projects remain renderable; new node types are additive).
- Simplicity & Performance: PASS (small tool modules; minimal shared glue).
- Plugin Independence: PASS (new plugins follow existing pattern using local `lib/types`).

Re-check after Phase 1 design: PASS

## Project Structure

### Documentation (this feature)

```text
specs/001-toolbar-basic-nodes/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
```text
apps/
└── studio/
  ├── public/
  │   └── registry.json
  └── src/
      ├── components/
      │   ├── Editor.tsx
      │   ├── CanvasView.tsx
      │   └── tools/
      │       ├── ConnectionTool.tsx         # reference pattern
      │       ├── TransformControls.tsx      # reference pattern
      │       └── (new) CreateToolLayer.tsx  # routes pointer gestures by activeTool
      ├── lib/
      │   └── commands/
      │       ├── constants.ts               # add tool command ids/shortcuts
      │       └── defaultCommands.ts         # register tool commands
      └── plugins/
          └── pluginResolver.ts              # registry-based plugin loading

plugins/
├── basic/
│   ├── text/                                # already exists
│   ├── (new) rectangle/
│   └── (new) circle/
└── media/
    └── (new) image/
```

**Structure Decision**: Implement gesture + tool behavior in `apps/studio` and implement the actual renderable components as plugins under `plugins/basic` and `plugins/media`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

## Phase 0: Research Output

- See [research.md](research.md) for confirmed APIs, existing Studio patterns, and the chosen interaction model.

## Phase 1: Design & Contracts

### Data model

- See [data-model.md](data-model.md).

### Contracts

- Creation tool behavior contract: [contracts/creation-tools.openapi.yaml](contracts/creation-tools.openapi.yaml)

## Phase 2: Implementation Planning (for `/speckit.tasks`)

Planned code changes (no code written in this phase):

1) Add/confirm core plugins and register them
  - Create `plugins/basic/rectangle` and `plugins/basic/circle` plugins.
  - Create `plugins/media/image` plugin.
  - Register component ids in `apps/studio/public/registry.json`:
    - `basic/rectangle`, `basic/circle`, `media/image`

2) Extend Studio command/tool definitions
  - Add command ids + default shortcuts:
    - `tool.circle` (suggested key `o` to match existing UI hint)
    - `tool.image` (no default single-key unless desired)
  - Register default tool commands in `apps/studio/src/lib/commands/defaultCommands.ts`.

3) Implement decoupled creation gesture layer
  - Add a `CreateToolLayer` that:
    - Listens to pointer down/move/up on the canvas container.
    - Computes world-space bounds using the current viewport (zoom/offset).
    - Renders a lightweight preview while dragging.
    - On pointer-up, creates a node with the correct `type` (component id) + default props.
    - Cancels on `Escape` (and ensures no node is created).
  - Wire creation to undo/redo by performing “insert + select” atomically (single temporal entry).

4) Implement per-tool creation behaviors
  - Rectangle/Circle: click creates default-sized shape; drag creates bounded shape.
  - Text: click creates `basic/text` with default props; drag sets initial bounds.
  - Image: prompt for image asset (file picker), convert to data URL, then place via click/drag.

5) Validate acceptance scenarios
  - Use [quickstart.md](quickstart.md) checklist.
  - Ensure `pnpm -w turbo run typecheck --filter=studio` passes.
