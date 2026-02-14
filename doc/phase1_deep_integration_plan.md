# Phase 1 深度接入：策略模式真正落地

## 背景

策略骨架已创建 (`EditorStrategy.ts`, `AppModeStrategy.ts`, `WidgetModeStrategy.ts`, `EditorShell.tsx`)，但 `Editor.tsx` (2199行) 尚未消费这些策略。上一次尝试通过添加 `useStrategy()` + fallback 条件分支，效果不理想。

**本次采用不同方式**：不在 Editor.tsx 里加 if/else，而是将整块 Widget Mode 的 `useEffect` 逻辑**从 Editor.tsx 删除**，挪到 `EditorShell.tsx` 中由策略驱动处理。

> [!IMPORTANT]
> 这次改法的核心思路：**EditorShell 负责所有 mode-specific 初始化/保存**，Editor.tsx 只保留纯 UI 逻辑。Editor.tsx 不需要知道自己是在 Widget 还是 App 模式下运行。

## 当前 Editor.tsx 中需要提取的 Mode-Specific 代码块

| 行号 | 功能 | 属于 | 目标 |
|------|------|------|------|
| L104 | `import { isEmbedMode, on as onEmbedEvent, requestSave }` | Widget | 移除（由策略负责） |
| L161-168 | `embedVisibility` memo | Widget | 保留但改用策略提供的配置 |
| L427 | `isWidgetMode` 变量 | Widget | 移除 |
| L434 | `useAutoSave enabled: !isWidgetMode` | Widget | 由 EditorShell 控制 |
| L466-479 | Bootstrap 中的 `isHostProject` guard | Widget | 移除（策略 bootstrap 处理） |
| L791-856 | `triggerSave` useEffect | Widget | 迁移到 WidgetModeStrategy |
| L858-960 | embed init useEffect | Both | 迁移到策略 |
| L1126-1156 | `request-save` handler | Widget | 迁移到 WidgetModeStrategy |
| L1158-1178 | Post-bootstrap 握手 | Widget | 迁移到 WidgetModeStrategy |
| L1180-1197 | canvasConfig → kernel sync | Both | 保留（Phase 2 处理） |

## Proposed Changes

### ThingsVis Editor (Guest 端)

---

#### [MODIFY] [EditorShell.tsx](file:///f:/coding/thingsvis/apps/studio/src/components/EditorShell.tsx)

**当前**: 轻量 wrapper，仅创建策略 context 并渲染 `<Editor />`

**改为**: 承担 mode-specific 的初始化和保存协调

1. 新增 `onSaveRequest` 回调 prop 传给 Editor —— 当策略需要保存时，通过这个回调从 Editor 获取 `getProjectState()`
2. 新增 `embedVisibility` 计算，传给 Editor 作为 prop
3. 新增 `isWidgetMode` flag，传给 Editor 来控制 `useAutoSave` 的 `enabled`
4. 将 Widget Mode 的 `triggerSave`、`request-save`、post-bootstrap 握手逻辑放在 EditorShell 的 useEffect 中，通过策略驱动

```tsx
// EditorShell.tsx 新增的核心逻辑 (伪代码)
export default function EditorShell() {
  const { strategy } = useEditorStrategy(dashboardId)
  const editorRef = useRef<{ getProjectState: () => ProjectFile }>()

  // Widget Mode: triggerSave 由策略处理
  useEffect(() => {
    if (strategy.mode !== 'widget') return
    const cleanup = strategy.setupListeners()
    return cleanup
  }, [strategy])

  // 统一的保存回调（策略调用 save 时使用）
  const handleSave = useCallback(() => {
    if (!editorRef.current) return
    const state = editorRef.current.getProjectState()
    strategy.save(state)
  }, [strategy])

  return (
    <EditorStrategyContext.Provider value={strategy}>
      <Editor
        ref={editorRef}
        embedVisibility={strategy.getUIVisibility()}
        isWidgetMode={strategy.mode === 'widget'}
        onStrategySave={handleSave}
      />
    </EditorStrategyContext.Provider>
  )
}
```

---

#### [MODIFY] [Editor.tsx](file:///f:/coding/thingsvis/apps/studio/src/components/Editor.tsx)

**删除以下代码块** (~200行):

1. **删除** `triggerSave` useEffect (L791-856) — 迁移到 `WidgetModeStrategy.save()`
2. **删除** embed init useEffect (L858-960) — 迁移到 `WidgetModeStrategy.bootstrap()`
3. **删除** `request-save` useEffect (L1126-1156) — 迁移到 `WidgetModeStrategy.setupListeners()`
4. **删除** post-bootstrap 握手 useEffect (L1158-1178) — 迁移到 `WidgetModeStrategy.setupListeners()`
5. **删除** `isWidgetMode` 变量 (L427) — 改用 prop
6. **修改** `isEmbedMode` import — 减少未使用的导入

**新增接口**:

1. 新增 `props` 接受 `embedVisibility`, `isWidgetMode`, `onStrategySave`
2. 使用 `React.forwardRef` 暴露 `getProjectState` 给 EditorShell
3. `useAutoSave.enabled` 使用 `props.isWidgetMode` 代替本地变量

> [!WARNING]
> 这是高风险改动。需要确认 triggerSave/embed-init/request-save 三个 useEffect 的所有依赖项（如 `canvasConfig`, `store`, `getProjectState`）仍然可以在 EditorShell 层面获取。**关键依赖** `canvasConfig` 是 Editor 内部 state，必须通过 ref 暴露给 EditorShell。

---

#### [MODIFY] [WidgetModeStrategy.ts](file:///f:/coding/thingsvis/apps/studio/src/strategies/WidgetModeStrategy.ts)

当前 `save()` 和 `setupListeners()` 已实现，但 `setupListeners()` 中 `request-save` 的处理是占位的。改为直接通过回调获取项目状态并保存。

---

### ThingsPanel Host 端

#### ~~不需要改动~~

Host 端的 `ThingsVisWidget.vue` 和 SDK `client.ts` 改动已在之前的 bug fix 中完成（`loadWidgetConfig` 默认值、`payload?.config || payload` 兼容）。

---

## 执行顺序

```
1. Editor.tsx: 添加 forwardRef + 新 props 接口         (低风险)
2. EditorShell.tsx: 接入策略，传递 props               (中风险)
3. Editor.tsx: 删除 Widget-specific useEffects         (高风险)
4. TypeScript 编译验证                                  (验证)
5. 手动测试                                             (验证)
```

## Verification Plan

### TypeScript 编译检查
```powershell
cd f:/coding/thingsvis/apps/studio
npx tsc --noEmit 2>&1 | Select-String -Pattern "src/" | Where-Object { $_.Line -notmatch "@leafer|node_modules" }
```

### 手动测试 (需要用户协助)

由于没有自动化测试，需要用户在以下场景手动验证:

**Track A: Widget Mode (物模型 → Web 图表配置)**
1. 打开 ThingsPanel → 物模型 → Web 图表配置
2. 点击 "编辑画布"
3. 拖入一个文本组件，配置平台字段
4. 点击 "保存配置"
5. 关闭弹窗，确认预览区显示配置内容
6. 进入设备详情 → 图表 Tab，确认显示正常

**Track B: App Mode 独立 (直接访问 ThingsVis)**
1. 直接打开 ThingsVis (`http://localhost:3000/main`)
2. 创建新项目或打开已有项目
3. 编辑画布，添加/删除组件
4. 确认自动保存正常工作
5. 刷新页面，确认数据持久化

**Track C: App Mode 嵌入 (可视化 → ThingsVis 编辑器)**
1. 打开 ThingsPanel → 可视化 → ThingsVis
2. 选择项目 → 点击看板进入编辑器
3. 编辑画布，添加/删除组件
4. 确认自动保存正常 (使用 token 认证 + Cloud API)
5. 预览功能正常 (`thingsvis:preview` 消息)
6. 发布功能正常 (`thingsvis:publish` 消息)

**Track D: Viewer 预览 (可视化 → 看板预览)**
1. 打开某个已配置的看板预览页面
2. 确认 EmbedPage 加载和渲染正常
3. 确认 Grid/Fixed/Infinite 三种布局模式都能正确展示

> [!NOTE]
> 我建议在执行高风险步骤（Step 3 删除 useEffects）前，先完成 Step 1-2 并在不删除旧代码的情况下验证策略路径能正常工作。确认无误后再删除旧代码。
