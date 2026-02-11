# AI Code Change Log

## Purpose
This file serves as a **mandatory read** for any AI agent working on the `thingsvis` repository.
It documents significant architectural changes, refactoring decisions, or critical bug fixes that might not be obvious from the code alone.
Currently, this log is experimental and manual, but all AI assistants must consult it before starting new tasks to avoid regression or conflicting changes.

## Usage
- **Before Coding**: Review the "Recent Changes" section below.
- **After Coding**: If you made a significant change (e.g., changed build system, refactored core logic, modified project structure), append a new entry using the format below.

## Template
```markdown
### [YYYY-MM-DD] Title of Change
- **Author**: [AI Name / Model]
- **Description**: Brief summary of what changed and why.
- **Impact**: List affected modules or files.
- **Instructions**: Any special instructions for future AIs (e.g., "Do not remove this specific comment").
```

## Recent Changes

### [2026-02-11] Initial Setup
- **Author**: Antigravity (Google DeepMind)
- **Description**: Created this change log to ensure continuity between AI sessions.
- **Impact**: `AI_CHANGELOG.md`, `.cursorrules`
- **Instructions**: Always check this file first.

### [2026-02-11] Hide Toolbar in Embedded View
- **Author**: Antigravity (Google DeepMind)
- **Description**: Updated `ThingsVisViewer.vue` and `ThingsVisWidget.vue` (viewer mode) to explicitly hide the editor toolbar by appending `?showToolbar=0` to the embed URL.
- **Impact**: `ThingsVisViewer.vue`, `ThingsVisWidget.vue`
### [2026-02-11] Hide Tools in Grid Mode
- **Author**: Antigravity (Google DeepMind)
- **Description**: Updated `Editor.tsx` to hide drawing tools (`rectangle`, `circle`, `line`, `text`) when the canvas layout mode is set to 'grid'.
- **Impact**: `Editor.tsx`
- **Instructions**: Ensure any new drawing tools added in the future are also considered for this filter if they are not compatible with grid layout.

### [2026-02-11] Internal Routing for Embed Mode
- **Author**: Antigravity (Google DeepMind)
- **Description**: Implemented internal hash-based routing for "Preview" and "Data Sources" buttons when in Embed Mode (Self-Managed). This replaces the `window.open` behavior to ensure users stay within the ThingsPanel iframe. `PreviewPage` and `DataSourcesPage` back buttons now respect the `mode=embedded` parameter and return to the Editor.
- **Impact**: `Editor.tsx`, `PreviewPage.tsx`, `DataSourcesPage.tsx`
