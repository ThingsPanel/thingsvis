# ThingsVis Studio P1 体验增强：Spec-Kit 命令合集（对标 Figma / Excalidraw）

> 对标：操作风格 Figma / Excalidraw；功能对标 DataV 类大屏编辑器。
>
> P1 定位：**不再是阻断级**，但属于“日常使用效率/一致性”的关键提升：快捷键、视图控制、工具一致性、文件导入导出闭环、手势操作。
>
> 重要约束：
> - ✅ 允许修改：`apps/studio/*`、`apps/preview/*`、`packages/thingsvis-ui/*`、`plugins/*`。
> - ⛔ 禁止修改：`packages/thingsvis-kernel/*`、`packages/thingsvis-schema/*`。

## 命名与分类口径（P0/P1/P2 统一）

- **命名规则**：`P{优先级}-{序号} [Category] 标题`
- **Category 集合（固定）**：
  - **[View]** 视图/缩放/适配/手势
  - **[Edit]** 基础编辑（撤销/重做/快捷键一致性）
  - **[Tools]** 工具系统（工具命令覆盖、工具栏一致性）
  - **[Project]** 项目管理（导入/导出/文件系统）
  - **[Help]** 帮助/可发现性（快捷键面板）

## 分类索引

- [View]：P1-1、P1-4
- [Edit]：P1-2
- [Tools]：P1-3
- [Project]：P1-5
- [Help]：P1-6

---

## P1-1 [View] 视图快捷键闭环：缩放/复位/适配（Ctrl/⌘ + + / - / 0 / 1）

### /speckit.specify

```text
Feature: View Zoom Commands and Shortcuts

Priority: P1

Problem Statement:
The command system defines view commands (zoom in/out/reset/fit), but they are not wired to actual viewport updates. Users expect Figma-style zoom shortcuts to work reliably.

User Stories:
1) As a user, Ctrl/⌘ + + zooms in.
2) As a user, Ctrl/⌘ + - zooms out.
3) As a user, Ctrl/⌘ + 0 resets zoom to 100%.
4) As a user, Ctrl/⌘ + 1 fits the page/canvas into view.

Acceptance Criteria:
- AC1: Shortcuts trigger viewport zoom changes immediately.
- AC2: Zoom is centered on the viewport center (or mouse position, if easy).
- AC3: Works regardless of selected tool (except when typing in inputs).
- AC4: No kernel/schema changes.

Edge Cases:
- Zoom clamping (e.g., min 10%, max 400%).
- On fixed canvas mode: Fit uses canvas width/height.
- On infinite canvas mode: Fit either no-op or fits bounding box of nodes (choose simplest).

Files Involved:
- apps/studio/src/lib/commands/constants.ts (already has VIEW_* IDs)
- apps/studio/src/lib/commands/defaultCommands.ts (register VIEW_* commands)
- apps/studio/src/components/Editor.tsx (wire deps)
- apps/studio/src/components/CanvasView.tsx (viewport setter)
```

### /speckit.plan

```text
Technical Implementation Plan: Wire VIEW_* commands

Step 1: Define viewport API from CanvasView
- CanvasView currently tracks vpRef.current and emits onViewportChange.
- Provide Editor a minimal API to control viewport:
  - Option A: Editor holds state and passes `viewport` + `setViewport` props into CanvasView.
  - Option B (minimal changes): CanvasView exposes callbacks to update internal viewport:
    - `onZoomIn()`, `onZoomOut()`, `onZoomReset()`, `onZoomFit()`.

Step 2: Implement View command handlers
- In defaultCommands.ts, register commands:
  - view.zoomIn -> deps.zoomIn?.()
  - view.zoomOut -> deps.zoomOut?.()
  - view.zoomReset -> deps.zoomReset?.()
  - view.fit -> deps.zoomFit?.()

Step 3: Wire deps in Editor
- Add deps implementation that delegates to CanvasView control functions.
- Keep logic centralized (single source of truth) so toolbar zoom buttons and shortcuts share code.

Step 4: Implement zoom calculations
- zoomIn/out: multiply/divide by a factor (e.g., 1.1), clamp.
- zoomReset: set zoom = 1.
- fit:
  - For fixed canvas: scale = min(viewportW / canvasW, viewportH / canvasH) and clamp.
  - Optionally add padding (e.g., 0.9 multiplier).

Step 5: QA
- Verify keyboard shortcuts work and do not trigger while typing.
- Verify zoom indicator (if any) matches.
```

---

## P1-2 [Edit] 重做快捷键一致性：支持 Ctrl+Shift+Z（并兼容 Ctrl+Y）

### /speckit.specify

```text
Feature: Redo Shortcut Compatibility

Priority: P1

Problem Statement:
The command system maps redo to Ctrl/⌘+Y, but the editor UI hint list mentions Ctrl/⌘+Shift+Z (Figma-style). This inconsistency confuses users.

User Stories:
1) As a user, Ctrl/⌘+Shift+Z redoes (Figma style).
2) As a user, Ctrl/⌘+Y also redoes (Windows legacy), if possible.

Acceptance Criteria:
- AC1: Ctrl/⌘+Shift+Z triggers redo.
- AC2: Ctrl/⌘+Y still triggers redo (optional but recommended).
- AC3: Shortcut help panel shows both bindings if both exist.

Files Involved:
- apps/studio/src/lib/commands/constants.ts
- apps/studio/src/lib/commands/types.ts (if ShortcutKey supports sequences)
- apps/studio/src/lib/commands/useKeyboardShortcuts.ts
- apps/studio/src/components/Editor.tsx (static shortcuts list, if still used)
```

### /speckit.plan

```text
Technical Implementation Plan: Multi-binding shortcuts

Step 1: Decide data structure
- Current DEFAULT_SHORTCUTS maps id -> ShortcutKey[] (single binding).
- Upgrade to allow multiple bindings:
  - Option A: shortcut: ShortcutKey[] | ShortcutKey[][]
  - Option B: add `alternateShortcuts?: ShortcutKey[][]`

Step 2: Implement in useKeyboardShortcuts
- When registering listeners, match against:
  - primary shortcut
  - any alternate shortcuts

Step 3: Update constants
- Keep redo primary as ['mod','shift','z']
- Add alternate ['mod','y'] for Windows.

Step 4: Update help panel rendering
- Show both shortcut variants.

Step 5: QA
- Ctrl+Shift+Z -> redo
- Ctrl+Y -> redo
- Undo still Ctrl+Z
```

---

## P1-3 [Tools] 工具/快捷键系统一致性：补齐工具命令并与工具栏同步

### /speckit.specify

```text
Feature: Tool Command Coverage and Toolbar Sync

Priority: P1

Problem Statement:
Editor toolbar includes tools (circle, arrow/connection, image) but command IDs only include select/rectangle/text/pan. Users expect tool switching shortcuts to cover all shipped tools or at least be consistent.

User Stories:
1) As a user, pressing a tool shortcut switches to the same tool as clicking the toolbar.
2) As a user, the Shortcut Help Panel lists only supported shortcuts (no lies).

Acceptance Criteria:
- AC1: Tool definitions in UI and command system match.
- AC2: If a tool exists in toolbar, it either has a shortcut+command or is intentionally excluded and not shown in help.
- AC3: No kernel/schema changes.

Files Involved:
- apps/studio/src/components/Editor.tsx (tools array + activeTool)
- apps/studio/src/lib/commands/constants.ts
- apps/studio/src/lib/commands/defaultCommands.ts
- apps/studio/src/components/tools/* (actual tool behavior)
```

### /speckit.plan

```text
Technical Implementation Plan: Single Source of Truth for tools

Step 1: Identify real tool set
- Confirm which tools are functional today:
  - select, rectangle, circle, arrow/connection, text, image, pan.

Step 2: Add missing command IDs (if tools are supported)
- In constants.ts add:
  - tool.circle
  - tool.arrow (or tool.connection)
  - tool.image
- Add default shortcuts (pick a conservative set):
  - O for circle (already shown in UI list)
  - A for arrow/connection (only if not conflicting)
  - I for image (optional)

Step 3: Wire defaultCommands setTool
- defaultCommands already supports deps.setTool.
- Expand to register those commands.

Step 4: Make help panel and UI hints consistent
- Remove/replace static shortcuts list in Editor if it diverges.
- Prefer generating displayed shortcuts from commandRegistry.

Step 5: QA
- Press tool shortcut keys; active tool changes and cursor/behavior follows.
```

---

## P1-4 [View] Space 临时抓手（按住 Space 拖拽平移）

### /speckit.specify

```text
Feature: Hold Space to Pan (Temporary Hand Tool)

Priority: P1

Problem Statement:
Figma/Excalidraw users rely on holding Space to temporarily pan the canvas while keeping their current tool. Current editor has a pan tool (H) but lacks Space temporary hand.

User Stories:
1) As a user, while holding Space, dragging pans the viewport.
2) As a user, releasing Space returns to the previous tool.

Acceptance Criteria:
- AC1: Space down enters temporary pan mode; Space up restores previous tool.
- AC2: Works even when current tool is select/shape/text.
- AC3: Does not trigger while typing in text inputs.
- AC4: No kernel/schema changes.

Files Involved:
- apps/studio/src/components/Editor.tsx (activeTool state)
- apps/studio/src/components/CanvasView.tsx (pan behavior)
- apps/studio/src/lib/commands/useKeyboardShortcuts.ts (input ignore policy)
```

### /speckit.plan

```text
Technical Implementation Plan: Temporary tool override

Step 1: Track tool stack
- In Editor, keep:
  - activeTool
  - prevToolRef
  - isSpacePanning state

Step 2: Global key listeners
- On keydown Space:
  - if target is input/textarea/contentEditable: ignore
  - if not already panning:
    - prevToolRef = activeTool
    - setActiveTool('pan')
    - setIsSpacePanning(true)
- On keyup Space:
  - if isSpacePanning:
    - setActiveTool(prevToolRef)
    - setIsSpacePanning(false)

Step 3: Ensure CanvasView uses activeTool
- CanvasView should treat tool === 'pan' as enabling drag-to-pan.

Step 4: QA
- Hold Space + drag -> pans.
- Release -> returns to prior tool.
```

---

## P1-5 [Project] 文件导入/导出：接入 File System Access API（含 fallback）

### /speckit.specify

```text
Feature: Import/Export using File System Access API with Fallback

Priority: P1

Problem Statement:
The repo already contains a File System Access wrapper (fileSystem.ts), but Project import/export may not use it yet. DataV/Excalidraw style workflows expect easy import/export, and modern browsers should use native file pickers.

User Stories:
1) As a user, I can export the current project as a .thingsvis file.
2) As a user, I can import a .thingsvis JSON file.
3) As a user, if File System Access API is not available, fallback to normal download/upload.

Acceptance Criteria:
- AC1: Export uses save dialog when available.
- AC2: Import uses open dialog when available.
- AC3: Invalid JSON shows clear error.
- AC4: No kernel/schema changes.

Files Involved:
- apps/studio/src/lib/storage/fileSystem.ts (already exists)
- apps/studio/src/components/ProjectDialog.tsx
- apps/studio/src/components/Editor.tsx (hook exportProject dependency)
- apps/studio/src/lib/storage/schemas.ts (validation)
```

### /speckit.plan

```text
Technical Implementation Plan: Hook fileSystem.ts into ProjectDialog

Step 1: Identify current import/export implementation
- ProjectDialog likely uses an <input type=file> or Blob download.

Step 2: Export flow
- Generate Blob from currentProject JSON.
- Call saveProjectFile(blob, projectName) from fileSystem.ts.

Step 3: Import flow
- Call openProjectFile() to get File.
- Read text -> JSON.parse -> validate with ProjectFileSchema.
- On success: call onProjectLoad(project)
- On failure: show toast/dialog error.

Step 4: Wire commands
- In Editor registerDefaultCommands, provide exportProject handler that opens ProjectDialog or directly exports.

Step 5: QA
- Export then import round-trip yields same project.
- Works in browsers without FS access.
```

---

## P1-6 [Help] 快捷键帮助面板“真实化”：直接从 CommandRegistry 渲染（避免静态列表漂移）

### /speckit.specify

```text
Feature: Shortcuts Help Panel Driven by CommandRegistry

Priority: P1

Problem Statement:
Editor currently has a static shortcuts list in UI code which can drift from actual command registry bindings (e.g., redo key mismatch, tool coverage). This leads to incorrect documentation inside the product.

User Stories:
1) As a user, pressing ? shows a correct, complete shortcut list.
2) As a user, shortcuts are grouped by category (tool/edit/view/project/help).

Acceptance Criteria:
- AC1: Help panel content is generated from registered commands.
- AC2: Commands missing shortcuts are either hidden or shown clearly as "unbound".
- AC3: Labels support zh/en.

Files Involved:
- apps/studio/src/components/ShortcutHelpPanel.tsx
- apps/studio/src/lib/commands/CommandRegistry.ts
- apps/studio/src/lib/commands/types.ts
- apps/studio/src/components/Editor.tsx
```

### /speckit.plan

```text
Technical Implementation Plan: Render registry commands

Step 1: Expose read API in commandRegistry
- Ensure CommandRegistry can return:
  - listAllCommands(): Command[]
  - optionally grouped by category.

Step 2: Update ShortcutHelpPanel
- Accept registry as prop or import singleton.
- Render commands grouped by category label map.
- For each command:
  - show label (zh/en)
  - show shortcuts (support multi-binding if implemented in P1-2)

Step 3: Remove static shortcuts list
- In Editor, remove or de-emphasize hardcoded shortcuts array.

Step 4: QA
- Registering/removing commands changes panel output automatically.
```
