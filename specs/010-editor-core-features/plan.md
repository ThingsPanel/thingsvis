# Implementation Plan: Editor Core Features

**Branch**: `010-editor-core-features` | **Date**: 2026-01-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-editor-core-features/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement editor core features for ThingsVis Studio: auto-save with debounce, project persistence to IndexedDB, keyboard shortcuts via CommandRegistry pattern, and preview mode integration with `apps/preview`.

**Key Technical Decisions** (from clarification):
1. **Storage**: IndexedDB for project data + localStorage for recent projects list
2. **Auto-save**: 1-second debounce + 10-second periodic check (Excalidraw-style)
3. **File format**: `.thingsvis` JSON containing `meta/canvas/nodes/dataSources`
4. **Shortcuts**: CommandRegistry command registration pattern with platform adaptation (Mac ⌘ / Win Ctrl)
5. **Preview**: Reuse `apps/preview` via `?mode=` URL parameter (dev/user/kiosk)
6. **Data transfer**: postMessage + encrypted one-time token (not URL parameters for security)

## Technical Context

**Language/Version**: TypeScript 5.x, React 18.x  
**Primary Dependencies**: 
- `idb-keyval` (already in use for plugin cache)
- `zod` (schema validation)
- `@thingsvis/kernel` (HistoryManager, KernelStore)
- `@thingsvis/schema` (PageSchema, NodeSchema)

**Storage**: IndexedDB via `idb-keyval` (project data) + localStorage (recent projects metadata)  
**Testing**: Vitest (existing test harness in `apps/studio/tests/`)  
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge)  
**Project Type**: Web (monorepo with apps + packages)  
**Performance Goals**: 
- Save operations complete in <500ms
- Shortcut response in <100ms
- Preview opens in <2 seconds
**Constraints**: 
- Must not modify `packages/thingsvis-kernel` or `packages/thingsvis-schema` (per constitution)
- All new code in `apps/studio` (host application)
**Scale/Scope**: Single-user local editing, projects up to 1000 nodes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Micro-Kernel & Separation of Concerns | ✅ PASS | All UI/storage logic stays in `apps/studio`, not kernel |
| II. Schema-First Contracts (Zod) | ✅ PASS | ProjectFileSchema defined with Zod in `apps/studio/src/lib/storage/schemas.ts` |
| III. Type Safety & Predictability | ✅ PASS | TypeScript strict mode, no `any` in contracts |
| IV. Backward Compatibility | ✅ PASS | File format versioned (`meta.version: '1.0.0'`), migration strategy documented |
| V. Simplicity & Performance | ✅ PASS | Debounced saves (1s), no heavy UI-thread computation |
| VI. Plugin Independence | ✅ N/A | Feature does not affect plugin system |

**Pre-Design Gate**: ✅ All gates PASS  
**Post-Design Gate**: ✅ All gates PASS (re-evaluated after Phase 1 design)

## Project Structure

### Documentation (this feature)

```text
specs/010-editor-core-features/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── project-storage.api.ts
│   └── command-registry.api.ts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/studio/src/
├── lib/
│   ├── storage/
│   │   ├── projectStorage.ts      # IndexedDB project CRUD
│   │   ├── recentProjects.ts      # localStorage recent list
│   │   └── autoSave.ts            # Debounced auto-save hook
│   └── commands/
│       ├── CommandRegistry.ts     # Command registration & execution
│       ├── useKeyboardShortcuts.ts # React hook for key bindings
│       └── defaultCommands.ts     # Tool/edit/project/view commands
├── components/
│   ├── ShortcutHelpPanel.tsx      # ? key modal
│   ├── ProjectDialog.tsx          # Open/save dialog
│   └── SaveIndicator.tsx          # Save status display
└── hooks/
    └── useAutoSave.ts             # Auto-save integration

apps/preview/src/
├── App.tsx                        # Add mode switching (dev/user/kiosk)
├── hooks/
│   └── usePreviewMode.ts          # URL parameter parsing
└── components/
    ├── DevToolbar.tsx             # Existing dev tools
    ├── UserToolbar.tsx            # Minimal user mode toolbar
    └── KioskView.tsx              # Fullscreen wrapper
```

**Structure Decision**: Web application with `apps/studio` as the primary editor and `apps/preview` enhanced with multi-mode support. All new storage and command logic lives in `apps/studio/src/lib/` to keep kernel clean.

## Complexity Tracking

> No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | - | - |
