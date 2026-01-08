# ThingsVis Studio P0 修复任务：Spec-Kit 命令合集

> 对标：操作风格 Figma / Excalidraw；功能对标 DataV 类大屏编辑器。
> 
> 目标：把当前编辑器的 **P0 阻断级问题** 拆成可独立执行的 Spec-Kit 输入（`/speckit.specify`、`/speckit.plan`），确保 AI 可以“照着做”完成实现。

## 命名与分类口径（P0/P1/P2 统一）

- **命名规则**：`P{优先级}-{序号} [Category] 标题`
- **Category 集合（固定）**：
  - **[Transform]** 选中/变换/坐标体系（拖拽、缩放、旋转）
  - **[Selection]** 选择/多选/框选/批量操作
  - **[Edit]** 基础编辑（删除、复制粘贴、撤销重做）
  - **[Layers]** 图层（顺序、分组、锁定/显隐）
  - **[Preview]** 预览/演示（新标签页、全屏、展示模式）

## 分类索引

- [Transform]：P0-1、P0-5
- [Selection]：P0-4
- [Edit]：P0-2、P0-3
- [Layers]：P0-6
- [Preview]：P0-7

---

## P0-1 [Transform] 修复：缩放(Zoom)下拖拽/缩放坐标错误

### /speckit.specify

```text
Feature: Fix Transform Coordinates Under Canvas Zoom

Priority: P0 (Blocker)

Problem Statement:
When canvas is zoomed (e.g., 50% or 200%), dragging or resizing nodes results in incorrect position/size updates. TransformControls applies screen-space deltas directly to world-space coordinates, causing nodes to drift/jump.

User Stories:
1) As a user, at any zoom level, dragging a node moves it accurately in world coordinates.
2) As a user, at any zoom level, resizing a node updates width/height accurately.
3) As a user, undo/redo restores exact positions/sizes regardless of current zoom.

Acceptance Criteria:
- AC1: Dragging at any zoom level updates node.position (x/y) correctly.
- AC2: Resizing at any zoom level updates node.size (width/height) correctly.
- AC3: Visual proxy position always matches stored world coordinates after zoom changes.
- AC4: Undo/redo correctness is preserved.

Edge Cases:
- Zoom level changes during drag/resize (should complete using current vp.zoom at end; no jumps).
- Panned viewport offset must not break drag/resizing.
- Multi-select (if implemented) should remain consistent.

Reference Behavior:
- Figma / Excalidraw: coordinate mapping is precise under any zoom.

Implementation Scope:
- Allowed to modify apps/studio and packages/thingsvis-ui.
- Do NOT modify packages/thingsvis-kernel or packages/thingsvis-schema.

Files Involved (starting points):
- apps/studio/src/components/CanvasView.tsx
- apps/studio/src/components/tools/TransformControls.tsx
```

### /speckit.plan

```text
Technical Implementation Plan: Zoom-Aware Transform in TransformControls

Root Cause:
- In TransformControls.tsx, dragEnd/resizeEnd compute new x/y from DOM left/top and Moveable translate deltas.
- Those deltas are in screen pixels while node.position is in world coordinates.
- CanvasView maintains viewport state (zoom, offsetX, offsetY) via vpRef.current.

High-level Strategy:
1) Provide TransformControls access to the current viewport zoom.
2) Convert screen-space deltas to world-space deltas by dividing by zoom.
3) Persist node updates using kernelStore actions (updateNode/addNodes/etc.).
4) Keep the proxy DOM aligned with world coordinates.

Step 0: Confirm coordinate spaces
- Inspect apps/studio/src/components/CanvasView.tsx:
  - UI_CanvasView emits onViewportChange(vp) where vp has zoom and offsets.
  - Proxy layer uses: left = schema.position.x, top = schema.position.y, and is wrapped by a parent div scaled by vp.zoom.
  - This implies proxy element left/top are world coordinates, but on-screen movement is scaled.

Step 1: Pass viewport ref to TransformControls
- In apps/studio/src/components/CanvasView.tsx, pass a ref or getter:
  - Option A (preferred): pass `getViewport: () => vpRef.current`.
  - Option B: pass `viewportRef: React.RefObject<typeof vpRef.current>`.

Example:
- CanvasView.tsx:
  - <TransformControls ... getViewport={() => vpRef.current} />

Step 2: Update TransformControls to use zoom when committing
- In dragEnd:
  - screenTx, screenTy come from lastEvent.beforeTranslate.
  - worldDeltaX = screenTx / zoom
  - worldDeltaY = screenTy / zoom
  - worldX = baseWorldX + worldDeltaX
  - worldY = baseWorldY + worldDeltaY

- In resizeEnd:
  - width/height changes come in screen pixels; commit world size as (screenW / zoom) if needed.
  - IMPORTANT: determine what Moveable reports:
    - If proxy element is inside a scaled parent, Moveable width/height are likely in screen pixels.
    - Validate by logging at zoom=1 vs zoom=2.
  - Ensure final schema.size is in world units:
    - worldW = screenW / zoom
    - worldH = screenH / zoom

Step 3: Remove reliance on target.style.left/top as source of truth
- Instead of reading `target.style.left/top` (which may reflect scaled geometry), read base values from kernel state:
  - On dragStart, for all selected nodes, store baseX/baseY from node.schemaRef.position.
  - Use those as baseWorld values.

Step 4: Regression checks
- Zoom = 1.0: behavior unchanged.
- Zoom = 0.5 / 2.0: drag/resizes are correct.
- Undo/redo: still works.

Step 5: Testing
Manual QA matrix:
- Zoom 50%: drag right ~200px on screen; world delta should be ~400? Wait—this depends on expectation.
  - Define expected behavior explicitly:
    - Figma/Excalidraw style is: moving mouse 200px on screen moves object 200px in screen space.
    - Since world is scaled, that means worldDelta = screenDelta / zoom.
    - Example: zoom=0.5 => screenDelta=200 => worldDelta=400 (object appears to move 200px on screen).
    - zoom=2.0 => screenDelta=200 => worldDelta=100.
  - Use this invariant: “screen movement follows cursor 1:1”.

Deliverables:
- Code changes in CanvasView.tsx and TransformControls.tsx.
- No kernel/schema package changes.
```

---

## P0-2 [Edit] 实现：Delete 键删除选中节点

### /speckit.specify

```text
Feature: Delete Selected Nodes via Delete Key

Priority: P0 (Blocker)

Problem Statement:
Delete shortcut is defined in command constants but is not implemented/registered. Users cannot delete selected nodes via keyboard.

User Stories:
1) As a user, pressing Delete removes currently selected nodes.
2) As a user, pressing Delete with no selection does nothing.
3) As a user, deletion is undoable (Ctrl+Z restores deleted nodes).

Acceptance Criteria:
- AC1: Delete removes all selected nodes.
- AC2: Deletion participates in undo/redo history.
- AC3: No errors when nothing selected.
- AC4: (Optional) Locked nodes are not deleted.

Reference:
- Figma/Excalidraw: Delete is a fundamental edit shortcut.

Files Involved:
- apps/studio/src/lib/commands/defaultCommands.ts
- apps/studio/src/components/Editor.tsx
```

### /speckit.plan

```text
Technical Implementation Plan: Delete Command

Step 1: Confirm existing command IDs/shortcuts
- Check apps/studio/src/lib/commands/constants.ts has:
  - COMMAND_IDS.EDIT_DELETE
  - DEFAULT_SHORTCUTS[EDIT_DELETE] = ['delete']

Step 2: Extend DefaultCommandsDependencies
- In apps/studio/src/lib/commands/defaultCommands.ts, add dependencies:
  - getKernelState: () => KernelState
  - deleteSelected: () => void  OR deleteNodes: (ids: string[]) => void

Step 3: Register edit.delete command
- Add a createCommand(COMMAND_IDS.EDIT_DELETE, ...) in createDefaultCommands.
- Implementation:
  - const state = deps.getKernelState()
  - const selected = state.selection.nodeIds
  - if empty -> return
  - (Optional) filter locked nodes
  - deps.deleteNodes(selected)

Step 4: Wire deps in Editor
- In apps/studio/src/components/Editor.tsx registerDefaultCommands({ ... }):
  - getKernelState: () => store.getState()
  - deleteNodes: (ids) => store.getState().removeNodes(ids)

Step 5: QA
- Select 1 node -> Delete -> removed
- Ctrl+Z -> restored
- No selection -> Delete -> no-op
```

---

## P0-3 [Edit] 实现：复制/粘贴/快速复制（Ctrl+C / Ctrl+V / Ctrl+D）

### /speckit.specify

```text
Feature: Copy, Paste, Duplicate Nodes

Priority: P0 (Blocker)

Problem Statement:
Editor defines copy/paste shortcuts but does not implement the behavior. Users cannot copy/paste/duplicate nodes.

User Stories:
1) As a user, Ctrl+C copies selected nodes.
2) As a user, Ctrl+V pastes copied nodes with a small offset so they are visible.
3) As a user, Ctrl+D duplicates selected nodes in one step.
4) As a user, pasted nodes become the current selection.

Acceptance Criteria:
- AC1: Ctrl+C with selection stores a serialized clipboard of nodes.
- AC2: Ctrl+V pastes with deterministic offset (+20px x/y, increasing per paste).
- AC3: Ctrl+D duplicates selection same as copy+paste.
- AC4: New nodes get unique IDs.
- AC5: Undo/redo works (paste/duplicate is undoable).

Edge Cases:
- Empty clipboard -> paste no-op.
- Multi-node copy/paste keeps relative layout.
- Locked nodes: define policy (copy allowed; pasted copies are unlocked).

Reference:
- Figma: Ctrl+D duplicates; paste offsets.
- Excalidraw: similar.

Files Involved:
- apps/studio/src/lib/commands/constants.ts
- apps/studio/src/lib/commands/defaultCommands.ts
- apps/studio/src/components/Editor.tsx
- (New) apps/studio/src/lib/clipboard.ts
```

### /speckit.plan

```text
Technical Implementation Plan: Internal Clipboard + Commands

Step 0: Confirm what exists today
- COMMAND_IDS includes: edit.copy, edit.paste (and maybe not edit.duplicate).
- DEFAULT_SHORTCUTS defines mod+c, mod+v.
- Editor UI currently shows Ctrl/⌘+D in the shortcut list but command may not exist.

Step 1: Add edit.duplicate command ID + shortcut (if missing)
- Update apps/studio/src/lib/commands/constants.ts:
  - Add COMMAND_IDS.EDIT_DUPLICATE = 'edit.duplicate'
  - Add DEFAULT_SHORTCUTS[EDIT_DUPLICATE] = ['mod','d']

Step 2: Implement clipboard utility (new file)
- Create apps/studio/src/lib/clipboard.ts:
  - In-memory clipboard (fast)
  - localStorage fallback (optional) for cross-tab
  - pasteCounter to increase offset
  - helpers:
    - copyNodes(nodes)
    - readClipboard()
    - makePastedNodes(nodesToPaste) -> new ids + offset
    - resetPasteCounter()

Step 3: Add dependencies to DefaultCommandsDependencies
- In defaultCommands.ts, extend deps:
  - getKernelState: () => KernelState
  - addNodes: (nodes: NodeSchemaType[]) => void
  - selectNodes: (ids: string[]) => void

Step 4: Register edit.copy/edit.paste/edit.duplicate
- Copy:
  - gather selected node schemas from state.nodesById[id].schemaRef
  - copyNodes(schemas)

- Paste:
  - readClipboard; if empty no-op
  - const pasted = makePastedNodes(clipboard)
  - deps.addNodes(pasted)
  - deps.selectNodes(pasted.map(n => n.id))

- Duplicate:
  - equivalent to paste using current selection as source:
    - gather selected schemas
    - makePastedNodes(selectedSchemas)
    - add/select

Step 5: Wire deps in Editor
- In registerDefaultCommands call:
  - getKernelState: () => store.getState()
  - addNodes: (nodes) => store.getState().addNodes(nodes)
  - selectNodes: (ids) => store.getState().selectNodes(ids)

Step 6: Undo/redo integration
- Verify addNodes/removeNodes/updateNode already participate in temporal.
- If addNodes isn't tracked, then wrap in an existing kernel actionStack command (search for actionStack usage).

Step 7: QA
- Ctrl+C then Ctrl+V duplicates with +20 offset.
- Paste multiple times offsets increment.
- Ctrl+D duplicates.
- Undo removes pasted nodes.
```

---

## P0-4 [Selection] 修复：框选/多选一致性 + 批量移动

### /speckit.specify

```text
Feature: Multi-Select and Batch Move

Priority: P0 (Blocker)

Problem Statement:
Box selection currently only selects the first node (MVP single-select). This breaks Figma/Excalidraw style workflows: users must be able to select and move multiple nodes together.

User Stories:
1) As a user, drag a selection box to select multiple nodes.
2) As a user, Ctrl/⌘ click toggles nodes in selection.
3) As a user, dragging moves all selected nodes together.

Acceptance Criteria:
- AC1: Box select selects all nodes in the box.
- AC2: Ctrl/⌘ click toggles node selection.
- AC3: Moving selection moves all selected nodes together.
- AC4: Locked nodes cannot be moved (and ideally are excluded).

Files Involved:
- apps/studio/src/components/tools/TransformControls.tsx
- apps/studio/src/components/CanvasView.tsx
```

### /speckit.plan

```text
Technical Implementation Plan: Multi-Select + Multi-Drag

Step 1: Fix Selecto selection handler
- In TransformControls.tsx:
  - Replace selectNode(first) with selectNodes(all)
  - Keep empty selection behavior.
  - Filter out locked nodes.

Step 2: Make proxy click support Ctrl/Shift modifiers
- In CanvasView.tsx proxy-layer node click handler:
  - if ctrl/meta -> toggle selection
  - else -> single select

Step 3: Implement batch movement commit
- Moveable may not move multiple DOM targets by default unless using group features.
- Implement a safe approach that works regardless:
  - During dragStart: record base positions for all selected ids (world coords).
  - During drag (optional): apply same translate to all selected proxy elements for UX.
  - During dragEnd: compute worldDelta from screen delta using zoom (depends on P0-1), and updateNode for each selected.

Step 4: QA
- Box select multiple nodes -> selection contains all.
- Drag -> all nodes move.
- Undo -> all restore.
```

---

## P0-5 [Transform] 修复：旋转落库（并确保可恢复）

### /speckit.specify

```text
Feature: Persist Rotation Changes

Priority: P0 (Blocker / Data correctness)

Problem Statement:
Rotation handles are enabled in TransformControls, but rotation is not written to state, so it is lost after refresh or undo/redo.

User Stories:
1) As a user, rotate a node and the rotation persists.
2) As a user, undo/redo restores rotation.

Acceptance Criteria:
- AC1: Rotation is stored in node data in a stable field.
- AC2: Preview/render respects rotation (not just selection proxy).
- AC3: Undo/redo works.

Constraints:
- Do NOT modify packages/thingsvis-schema.
- If schema lacks a rotation field, store rotation in node.props._rotation as a temporary solution.

Files Involved:
- apps/studio/src/components/tools/TransformControls.tsx
- apps/studio/src/components/CanvasView.tsx
- (Possibly) packages/thingsvis-ui (if actual rendering needs rotation support)
```

### /speckit.plan

```text
Technical Implementation Plan: Rotation Persistence

Step 0: Verify where rotation should live
- Inspect NodeSchemaType usage:
  - If schema has `rotation` field already, use it.
  - Otherwise store in `schema.props._rotation` (number degrees).

Step 1: Implement rotate handlers in TransformControls
- Add moveable.on('rotateStart'/'rotate'/'rotateEnd')
- On rotateEnd:
  - normalize angle to [0, 360)
  - kernelStore.getState().updateNode(nodeId, { props: { ...props, _rotation: angle } })
  - onUserEdit?.()

Step 2: Ensure visual application
- Proxy layer (selection targets) must render with rotation:
  - style.transform = `rotate(${angle}deg)`
  - set transformOrigin appropriately

- IMPORTANT: selection proxy rotation alone is not enough if the actual widget render (UI_CanvasView) ignores it.
  - Inspect packages/thingsvis-ui Canvas renderer to see if it can apply transforms from node schema.
  - If it does not support rotation:
    - Implement rotation in thingsvis-ui (allowed) by applying CSS transform to node container based on schema.props._rotation.
    - Do NOT touch thingsvis-kernel / thingsvis-schema.

Step 3: QA
- Rotate node, save, reload -> rotation preserved.
- Undo/redo restores rotation.
```

---

## P0-6 [Layers] 修复：分组/层级顺序持久化（避免重开丢失）

### /speckit.specify

```text
Feature: Persist Layer Order and Groups

Priority: P0 (Data loss)

Problem Statement:
LayerPanel supports groups and layer ordering operations, but ProjectFileSchema does not store `layerOrder` and `layerGroups`. After reopening/importing, groups/order are lost.

User Stories:
1) As a user, groups and layer order persist after reload.
2) As a user, export/import keeps groups and layer order.

Acceptance Criteria:
- AC1: Project file stores layerOrder and layerGroups.
- AC2: Reload restores groups/order.
- AC3: Backward compatibility: old projects without these fields still load.

Constraints:
- Do NOT modify packages/thingsvis-kernel.

Files Involved:
- apps/studio/src/lib/storage/schemas.ts
- apps/studio/src/components/Editor.tsx (getProjectState + load)
```

### /speckit.plan

```text
Technical Implementation Plan: Persist Layer Structures Without Kernel Changes

Step 0: Confirm current data is available
- In LayerPanel.tsx it reads from KernelState:
  - layerOrder
  - layerGroups
- Confirm store.getState() exposes these fields (it does, since LayerPanel reads it).

Step 1: Extend ProjectFile schema (backward compatible)
- Update apps/studio/src/lib/storage/schemas.ts:
  - Add optional fields:
    - layerOrder?: string[]
    - layerGroups?: Record<string, LayerGroupLike>
  - Define a zod schema for LayerGroupLike based on what LayerPanel expects:
    - { id, name, memberIds, expanded, visible, locked }

Step 2: Include these fields when saving
- Update apps/studio/src/components/Editor.tsx getProjectState:
  - const state = store.getState()
  - return { ..., layerOrder: state.layerOrder, layerGroups: state.layerGroups }

Step 3: Restore these fields when loading
- Because we cannot modify kernel, we must restore via existing store actions.
- First: discover available actions by searching in apps/studio usage:
  - search: createGroup, ungroup, bringToFront, sendToBack, toggleGroupExpanded, setGroupVisible, setGroupLocked
- Recreate groups:
  - For each saved group:
    - call store.getState().createGroup(memberIds)
    - then rename group (if API exists) OR accept default name if rename API absent.
    - apply expanded/visible/locked via existing actions if present.

- Restore order:
  - If store exposes a direct setter for layerOrder (e.g., setLayerOrder), use it.
  - If not, approximate by iterating saved order and using bringToFront/sendToBack APIs to reach the same order.

Step 4: Migration
- When loading a project without layerOrder/layerGroups:
  - layerOrder = nodes.map(n => n.id)
  - layerGroups = {}

Step 5: QA
- Create group + reorder layers -> save -> reload -> unchanged.
- Export -> import -> unchanged.
```

---

## P0-7 [Preview] 修复：预览必须新标签页打开（符合 spec + Figma/Datav 习惯）

### /speckit.specify

```text
Feature: Open Preview in a New Tab

Priority: P0 (Workflow blocker)

Problem Statement:
Current preview action navigates within the same tab via hash routing. For Figma/DataV workflows, preview should open in a separate tab to allow quick compare/edit.

User Stories:
1) As a user, pressing Ctrl+P opens preview in a new browser tab.
2) As a user, clicking the Preview button opens preview in a new tab.
3) As a user, preview shows the latest saved content.

Acceptance Criteria:
- AC1: Preview opens with window.open(..., '_blank')
- AC2: Editor triggers save before opening preview.
- AC3: Preview loads project by projectId and renders without editor UI.

Edge Cases:
- Popup blockers: if window.open returns null, fallback to same-tab navigation.

Files Involved:
- apps/studio/src/components/Editor.tsx
- apps/studio/src/lib/commands/defaultCommands.ts
- apps/studio/src/pages/PreviewPage.tsx
```

### /speckit.plan

```text
Technical Implementation Plan: New Tab Preview

Step 1: Update command behavior
- In Editor.tsx registerDefaultCommands -> openPreview:
  - await saveNow()
  - const url = `#/preview?projectId=${encodeURIComponent(projectId)}`
  - const w = window.open(url, '_blank')
  - if (!w) window.location.hash = url

Step 2: Update preview button
- In Editor.tsx Preview button onClick uses the same logic as command.

Step 3: QA
- Click Preview -> opens new tab.
- Ctrl+P -> opens new tab.
- Preview refresh -> shows latest.
```
