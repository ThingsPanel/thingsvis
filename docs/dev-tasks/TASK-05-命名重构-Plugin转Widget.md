# TASK-05：命名重构 — Plugin → Widget

> **优先级**：🟡 P1 强烈建议
> **预估工时**：0.5-1 人天
> **前置依赖**：TASK-00、TASK-02 完成后再做（避免冲突）
> **状态**：✅ 已完成（2026-02-24）— 63+ 文件修改，10 源文件重命名，3 目录重命名。plugins/→widgets/、plugin-sdk→widget-sdk、所有类型/函数/事件/变量/注释全部更新。

---

## 背景

~55 个文件需要重命名，尚未发版可直接硬重命名。

---

## 重命名映射

### 包名 + 目录

| 当前 | 目标 |
|------|------|
| `packages/thingsvis-plugin-sdk/` | `packages/thingsvis-widget-sdk/` |
| `@thingsvis/plugin-sdk` | `@thingsvis/widget-sdk` |
| `plugins/` | `widgets/` |
| `apps/studio/src/plugins/` | `apps/studio/src/widgets/` |
| `apps/studio/public/plugins/` | `apps/studio/public/widgets/` |
| `configs/rspack-plugin.config.js` | `configs/rspack-widget.config.js` |

### 核心类型

| 当前 | 目标 |
|------|------|
| `PluginMainModule` | `WidgetMainModule` |
| `PluginControls` / `PluginControlsSchema` | `WidgetControls` / `WidgetControlsSchema` |
| `PluginCategory` | `WidgetCategory` |
| `IPluginFactory` | `IWidgetFactory` |
| `definePlugin()` | `defineWidget()` |
| `loadPlugin()` | `loadWidget()` |
| `createPluginConfig()` | `createWidgetConfig()` |
| `createPluginRenderer()` | `createWidgetRenderer()` |
| `PLUGIN_LOAD_START/SUCCESS/FAILURE` | `WIDGET_LOAD_START/SUCCESS/FAILURE` |

---

## 分阶段执行

### Phase 1：目录 + 包名重命名
- [ ] 重命名所有上述目录和包
- [ ] `pnpm install` 确认依赖正常

### Phase 2：Schema → SDK → Kernel 类型重命名
- [ ] 所有核心类型按映射表重命名
- [ ] 更新所有 import 路径

### Phase 3：UI → Studio 消费层更新
- [ ] Studio 中所有 plugin 相关引用更新为 widget
- [ ] `registry.json` 路径更新

### Phase 4：rspack config + docs 更新
- [ ] 构建配置文件更新
- [ ] 文档中所有 plugin 引用更新

---

## 验收标准

1. `pnpm tsc --noEmit` 零错误
2. `pnpm lint` 零错误
3. `pnpm dev:all` 正常启动
4. 代码中无残留的 `plugin` 命名（搜索确认）
