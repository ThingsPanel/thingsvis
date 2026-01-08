# ThingsVis Studio P2 能力：Spec-Kit 命令合集（对标 DataV）

> 对标：操作风格 Figma / Excalidraw；功能对标 DataV 类大屏平台。
>
> P2 定位：**不阻断编辑器基本可用**，但决定“是否像 DataV 一样能交付/演示/分发”。
>
> 重要约束：
> - ✅ 允许修改：`apps/studio/*`、`apps/preview/*`、`packages/thingsvis-ui/*`、`plugins/*`。
> - ⛔ 禁止修改：`packages/thingsvis-kernel/*`、`packages/thingsvis-schema/*`。
> - ✅ 新能力优先走“插件生态”：新增可视化/装饰/素材类能力，优先在 `plugins/<category>/` 里实现。

## 命名与分类口径（P0/P1/P2 统一）

- **命名规则**：`P{优先级}-{序号} [Category] 标题`
- **Category 集合（固定）**：
  - **[Publish]** 发布/分享/嵌入/交付
  - **[Canvas]** 分辨率模板/自适应策略
  - **[Assets]** 模板/工程资产/素材管理
  - **[Plugins]** 通过插件补齐组件生态（装饰/资源类组件）

## 分类索引

- [Publish]：P2-1、P2-5
- [Canvas]：P2-2
- [Assets]：P2-3
- [Plugins]：P2-4
>
---

## P2-1 [Publish] 发布/分享闭环（本地发布：链接/嵌入）

### /speckit.specify

```text
Feature: Publish & Share (Local-first)

Priority: P2

Problem Statement:
Editor currently has a "Publish" button but it is a TODO. DataV-style workflow requires a publish step that generates a shareable link and an embeddable snippet so users can deliver dashboards.

Scope (P2 local-first):
- Publish is local-first (no server required).
- Publish produces:
  1) A "Share Link" that opens preview in presentation mode.
  2) An "Embed Snippet" (iframe) that can be used to embed the dashboard in other pages.
  3) An optional exported bundle (HTML + JSON) for offline delivery (nice-to-have inside P2, if feasible without extra infra).

User Stories:
1) As a user, I can click Publish to generate a stable share link.
2) As a user, I can copy an iframe embed code.
3) As a user, the share link loads the latest saved project.
4) As a user, published view hides editor UI and supports fullscreen.

Acceptance Criteria:
- AC1: Publish action saves project before generating link.
- AC2: Share link opens a viewer-only preview (no editor UI).
- AC3: Embed snippet is provided (iframe with correct sizing).
- AC4: Published view supports fullscreen toggle and ESC exit.
- AC5: Publish does not require modifying kernel/schema packages.

Security/Privacy Notes (local-first):
- No server means “access control” is limited. Link will be accessible to anyone who can access the same browser storage.
- For cross-device sharing, require export (file) or later cloud backend (out of scope for P2).

Edge Cases:
- Popup blocker prevents opening a new tab: fallback to same-tab navigation.
- Project not found in storage: show clear error.
- If share link used in a different browser or incognito: expected to fail (document this clearly in UI).

Reference:
- DataV: publish -> generate a link; embed code.

Files Involved:
- apps/studio/src/components/Editor.tsx (Publish button behavior)
- apps/studio/src/lib/storage/projectStorage.ts (ensure latest saved)
- apps/studio/src/pages/PreviewPage.tsx (viewer-only mode + query params)
- apps/studio/src/lib/storage/previewSession.ts (optional session token)
```

### /speckit.plan

```text
Technical Implementation Plan: Local Publish via Preview Modes

Goal:
- Implement a publish flow that generates URLs and embed snippets without any backend.

Design: "Published View" is a mode of Preview
- Add support for `#/preview?...&mode=published`.
- published mode requirements:
  - Hide debug/dev UI.
  - Show minimal overlay: fullscreen toggle + refresh.
  - Optional: hide "Back" to editor (or keep behind an option).

Step 1: Define URL contract
- Share Link:
  - `#/preview?projectId=<id>&mode=published`
- Embed Snippet:
  - `<iframe src="<origin>/#/preview?projectId=<id>&mode=published" width="100%" height="100%" style="border:0;"></iframe>`

Step 2: Implement publish action in Editor
- On Publish click:
  - await saveNow()
  - const url = `#/preview?projectId=${encodeURIComponent(projectId)}&mode=published`
  - Build shareLink = new URL(url, window.location.href).toString()
  - Build embedCode string
  - Show a simple dialog that includes:
    - Share link (copy button)
    - Embed snippet textarea (copy button)

UX Constraint (simple):
- Use existing dialog primitives in studio (`components/ui/dialog.tsx`).
- Do not add extra pages.

Step 3: Add preview mode handling
- In apps/studio/src/pages/PreviewPage.tsx:
  - Parse `mode` from hash query.
  - If mode === 'published':
    - Set label text from "预览模式" -> "已发布" (or similar)
    - Optionally hide Back button

Step 4: Verify fullscreen behavior
- PreviewPage already uses previewSession.toggleFullscreen().
- Ensure fullscreen button present in published mode.

Step 5: QA
- Publish in editor -> dialog shows share link + embed.
- Open share link in same browser -> loads correctly.
- Open in new browser -> expected missing data error.

Out-of-scope (future):
- Access control/password, view analytics, cross-device share.
```

---

## P2-2 [Canvas] 分辨率模板 + 自适应缩放策略（对标 DataV 大屏）

### /speckit.specify

```text
Feature: Canvas Resolution Presets and Preview Scaling Modes

Priority: P2

Problem Statement:
DataV-style dashboards need standard screen presets and predictable scaling on different displays. Current editor only supports manually typing width/height, and preview renders without a clear scaling mode selector.

User Stories:
1) As a user, I can pick from common resolution presets (e.g., 1920x1080, 1366x768, 3840x2160).
2) As a user, I can choose a scaling strategy for preview/published mode: contain (letterbox), cover (crop), stretch (non-uniform).
3) As a user, the chosen scaling strategy is saved with the project.

Acceptance Criteria:
- AC1: Editor provides a preset picker that sets canvas width/height.
- AC2: Preview/published mode applies selected scaling strategy.
- AC3: Scaling strategy is persisted and restored when reopening project.
- AC4: No kernel/schema changes.

Edge Cases:
- Fixed vs infinite canvas modes: scaling applies mainly to fixed.
- Very small screens: contain should always show full canvas.

Reference:
- DataV: “屏幕尺寸/分辨率模板 + 自适应策略”。

Files Involved:
- apps/studio/src/components/Editor.tsx (canvas config UI)
- apps/studio/src/lib/storage/schemas.ts (persist new config field)
- apps/studio/src/pages/PreviewPage.tsx (apply scaling)
- packages/thingsvis-ui CanvasView wrapper (if scaling requires container changes)
```

### /speckit.plan

```text
Technical Implementation Plan: Presets + Scaling

Step 1: Define a minimal data model (studio-side)
- Add to ProjectFile.canvas (studio schema, not thingsvis-schema):
  - `scaleMode?: 'contain' | 'cover' | 'stretch'`
- Backward compatible: optional with default = 'contain'.

Step 2: Add preset picker in Editor canvas settings
- In Editor right panel (when no node selected), under width/height:
  - Add a select dropdown:
    - 1920x1080 (Default)
    - 1366x768
    - 1440x900
    - 2560x1440
    - 3840x2160
  - On change: setCanvasConfig({ width, height }).

Step 3: Persist scaleMode
- Update getProjectState() to include canvas.scaleMode
- Update bootstrap load to read it and put into canvasConfig.

Step 4: Apply scaling in PreviewPage
- Approach: wrap CanvasView with a container that scales.
- Implement scaling purely via CSS transform on a wrapper:
  - Let canvas logical size = W x H.
  - Let viewport size = window.innerWidth/innerHeight.
  - Compute scale factors:
    - sx = viewportW / W
    - sy = viewportH / H
  - contain: scale = min(sx, sy)
  - cover: scale = max(sx, sy)
  - stretch: scaleX = sx, scaleY = sy
- Apply:
  - wrapper style: transform: scale(...)
  - transformOrigin: 'top left'
  - center it: translate to center or use flex.

Step 5: QA
- Set preset 1920x1080 + contain -> preview on small window letterboxes.
- cover -> fills window, cropping edges.
- stretch -> fills window with distortion.

Notes:
- Keep UI minimal: one dropdown for presets, one dropdown for scale mode.
```

---

## P2-3 [Assets] 模板/工程资产：导出/导入“模板”并加入模板库（最小实现）

### /speckit.specify

```text
Feature: Project Templates (Local)

Priority: P2

Problem Statement:
DataV relies heavily on templates. ThingsVis already supports export/import of .thingsvis, but lacks a concept of “template library” and “create from template”.

Scope (minimal P2):
- Allow user to "Save As Template" from the current project.
- Provide a "Templates" section inside existing ProjectDialog (no new pages) listing locally saved templates.
- Create new project from a template.

User Stories:
1) As a user, I can save current project as a template with a name and thumbnail.
2) As a user, I can create a new project from a saved template.
3) As a user, templates are stored locally (IndexedDB/localStorage).

Acceptance Criteria:
- AC1: Template list is visible and can be selected.
- AC2: Creating from template produces a new project ID (does not overwrite template).
- AC3: Template includes canvas/nodes/dataSources/layer structure fields present in current ProjectFile.
- AC4: No kernel/schema changes.

Edge Cases:
- Template created from older project versions.
- Missing thumbnails.

Files Involved:
- apps/studio/src/components/ProjectDialog.tsx
- apps/studio/src/lib/storage/projectStorage.ts (or a new templateStorage.ts)
- apps/studio/src/lib/storage/schemas.ts (Template schema)
```

### /speckit.plan

```text
Technical Implementation Plan: Local Template Storage

Step 1: Define TemplateFile schema (studio-only)
- In apps/studio/src/lib/storage/schemas.ts add:
  - TemplateMetaSchema: { id, name, createdAt, updatedAt, thumbnail? }
  - TemplateFileSchema: { meta, project: ProjectFile }

Step 2: Implement template storage
- Create apps/studio/src/lib/storage/templateStorage.ts:
  - Use idb-keyval store `thingsvis-studio` / `templates`
  - API:
    - saveTemplate(templateFile)
    - listTemplates() -> TemplateMeta[]
    - loadTemplate(templateId)
    - deleteTemplate(templateId)

Step 3: Update ProjectDialog UI (minimal)
- Add a "Templates" section below Recent Projects:
  - List templates with thumbnail + name
  - Buttons:
    - "Create from Template" (loads template.project, assigns new UUID, updates meta fields)
    - "Delete Template"
- Add "Save as Template" button (visible when currentProject exists):
  - prompts for template name
  - saves template

Step 4: Creating from template
- Implementation details:
  - const baseProject = template.project
  - const newId = crypto.randomUUID()
  - deep clone and replace:
    - meta.id = newId
    - meta.name = `<templateName> Copy` or user-provided
    - meta.createdAt/updatedAt = now
  - Save to projectStorage and then onProjectLoad(project)

Step 5: QA
- Save as template -> appears in template list.
- Create from template -> new project opens and edits do not change template.
- Delete template -> removed.
```

---

## P2-4 [Plugins] 装饰组件（边框/标题/背景）作为插件（对标 DataV 常用组件）

### /speckit.specify

```text
Feature: Decoration Components Pack (Plugins)

Priority: P2

Problem Statement:
DataV dashboards commonly need decoration widgets (borders, title bars, backgrounds). ThingsVis should provide a minimal set as plugins to enable users to build presentable dashboards quickly.

Scope (minimal P2 plugin pack):
1) Border Frame: configurable border radius, stroke color, stroke width.
2) Title Bar: text + alignment + optional icon.
3) Background Image: render an image covering the canvas area.

User Stories:
1) As a user, I can drag decoration components from the component library.
2) As a user, I can configure their style via PropsPanel controls.
3) As a user, these components render correctly in preview/published mode.

Acceptance Criteria:
- AC1: Each component is implemented as a plugin under plugins/.
- AC2: Each plugin defines props with zod schema.
- AC3: PropsPanel shows controls auto-generated from plugin controls.
- AC4: No kernel/schema changes.

Files Involved:
- plugins/basic/<new-decoration>/ (new plugins)
- apps/studio registry loading already supports plugins
```

### /speckit.plan

```text
Technical Implementation Plan: Decoration Plugins

Step 1: Create plugins in plugins/basic/
- Create:
  - plugins/basic/border-frame/
  - plugins/basic/title-bar/
  - plugins/basic/background-image/

Each plugin should include:
- entry module exposing:
  - id, version
  - schema (zod) for props
  - controls definition so PropsPanel can render UI
  - renderer component (React) using Tailwind classes when possible

Step 2: Define props schemas (examples)
- BorderFrame props:
  - radius: number
  - strokeWidth: number
  - strokeColor: string
  - fillColor?: string

- TitleBar props:
  - text: string
  - align: 'left' | 'center' | 'right'
  - fontSize: number
  - color: string

- BackgroundImage props:
  - url: string
  - fit: 'cover' | 'contain'

Step 3: Ensure resizable policy
- BackgroundImage likely resizable=false and stretches to canvas or to node size depending on design.
- Keep simple:
  - If resizable=false: node size omitted; component determines size by parent.
  - Otherwise, allow size.

Step 4: Verify studio registry
- Ensure these plugins appear under "基础组件" or "资源组件".
- If registry needs updates, add entries accordingly (follow existing plugin registry patterns).

Step 5: QA
- Drag into canvas -> renders.
- Configure props -> updates.
- Preview -> consistent.
```

---

## P2-5 [Publish] 发布导出（离线交付包）：HTML + JSON（可选项，若团队需要）

### /speckit.specify

```text
Feature: Export Offline Package (HTML + Project JSON)

Priority: P2 (Optional)

Problem Statement:
Some DataV users need to deliver dashboards to environments without access to the editor. A simple offline package (an HTML file that loads the exported .thingsvis JSON) enables sharing.

User Stories:
1) As a user, I can export an offline package.
2) As a user, I can open the exported HTML and view the dashboard.

Acceptance Criteria:
- AC1: Export generates a zip (or a folder via File System Access API) containing:
  - index.html
  - project.thingsvis
- AC2: index.html loads the JSON and renders via preview runtime.

Constraints:
- No server.
- No kernel/schema changes.

Files Involved:
- apps/studio/src/lib/storage/projectStorage.ts
- apps/preview runtime entry (or a minimal static loader)
```

### /speckit.plan

```text
Technical Implementation Plan: Offline Export

Option A (Simplest): Single HTML that embeds JSON
- Create an HTML template string that inlines the JSON in a <script type="application/json">.
- The page bootstraps the same preview renderer.
- Pros: no extra files.
- Cons: large HTML.

Option B (More standard): HTML + JSON file
- Use File System Access API if available to write two files.
- Fallback to download two files (user places together).

Implementation Outline:
1) Add export action in ProjectDialog or Publish dialog.
2) Build HTML loader that:
  - reads project JSON (fetch './project.thingsvis') or reads inline JSON
  - initializes @thingsvis/ui CanvasView with a local store
  - loads plugins from configured registry

QA:
- Export -> open index.html via local file server (browser fetch restrictions apply).
- Document: user should run a local static server to avoid CORS for fetch.
```
