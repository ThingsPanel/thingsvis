# TASK-18：画布背景增强与主题 UI

> **优先级**：🟡 P1
> **预估工时**：0.5-1 人天
> **前置依赖**：TASK-14-B（主题预设系统）

---

## 背景

当前画布仅支持纯色背景。竞品（GoView/DataRoom）支持渐变 + 图片 + 预设背景。主题切换 UI 也需要在此任务中落地。

---

## 任务清单

### 画布背景
- [ ] `CanvasSettingsPanel.tsx` — 背景类型选择器（纯色 / 渐变 / 图片）
- [ ] 纯色：现有颜色选择器
- [ ] 渐变：起止颜色 + 角度
- [ ] 图片：URL 输入 / 上传（复用 ImageSourceInput 组件）
- [ ] 背景设置持久化到 Dashboard JSON（`canvasConfig.background`）

### 主题切换
- [ ] `EditorTopNav.tsx` — 添加主题切换 dropdown（从 BUILT_IN_THEMES 读取列表）
- [ ] 切换主题时：
  - 更新 `document.documentElement` CSS class
  - 更新所有 Widget 的 `WidgetOverlayContext.theme`
  - 更新 KernelStore 中的 dashboard theme 设置
- [ ] 自定义主题编辑器（色板选择 → 保存为自定义 ThemePreset）

---

## 验收标准

1. 画布可设置渐变/图片背景，保存后刷新保持
2. 主题可在编辑器顶栏一键切换
3. 切换主题后 Widget 背景色和 ECharts 色板跟随变化
4. 自定义主题保存到 Dashboard JSON，不同 Dashboard 可用不同主题
