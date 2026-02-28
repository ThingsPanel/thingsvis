# TASK-11：国际化 (i18n) 多语言支持

> **优先级**：🟡 P1
> **预估工时**：2-3 人天
> **前置依赖**：TASK-05（Widget 命名重构完成后）
> **详细方案**：[i18n 架构诊断与实施方案](../../.gemini/antigravity/brain/0f68fefd-2519-457d-91b0-1431c861148b/implementation_plan.md)

---

## 背景

当前编辑器所有 UI 文本硬编码中文，涉及 **68+ 文件**，无任何 i18n 基础设施。开源项目必须支持多语言才能获得国际社区认可。

### 现状问题

| 区域 | 文件数 | 问题模式 |
|------|--------|---------|
| 编辑器组件 | ~25 | `labelZh(zh, en)` / `language === 'zh' ? ... : ...` 三元表达式 |
| 独立页面 | ~18 | 纯中文硬编码（Login/Register 等无 language prop） |
| Widget SDK | ~3 | `ControlField.label` 为 `string`，构建器硬编码中文分组名 |
| Widget 实现 | ~12 | controls.ts 中 label/placeholder/options 全部中文 |
| 命令系统 | ~2 | 临时 `{zh, en}` 对象模式 |

---

## 技术方案：react-i18next + 命名空间

- 使用 `react-i18next`（React 生态最成熟方案）
- 按模块分命名空间：`common` / `editor` / `pages` / `commands`
- Widget 独立翻译文件：`widgets/<name>/src/locales/zh.json` + `en.json`
- Widget SDK 类型扩展：`ControlField.label: string | I18nLabel`

---

## 分阶段任务清单

### Phase 0：基础设施（0.5h）
- [ ] 安装 `i18next` + `react-i18next`
- [ ] 创建 `apps/studio/src/i18n/index.ts` 初始化配置
- [ ] 修改 `main.tsx` 注入 `I18nextProvider`
- [ ] 创建 `locales/zh/*.json` + `locales/en/*.json` 骨架文件

### Phase 1：编辑器 UI 迁移（0.5-1天）
- [ ] 提取编辑器文本到 `editor.json` (zh/en)
- [ ] 迁移 `EditorTopNav.tsx` — 移除三元表达式，使用 `t()`
- [ ] 迁移 `PropsPanel.tsx` — 消除 24 处 `labelZh()` 调用
- [ ] 迁移 `CanvasSettingsPanel.tsx` (~20 处)
- [ ] 迁移 `ComponentsList.tsx` — 消除 `labelZh/labelEn` 属性
- [ ] 迁移 `ControlFieldRow.tsx` / `SaveIndicator.tsx` / `ShortcutHelpPanel.tsx`
- [ ] 迁移其他 ~15 个编辑器组件
- [ ] 从 `Editor.tsx` 移除 `useState<Language>` 和 language prop drilling
- [ ] 迁移 `constants.ts` (commands) 和 `defaultCommands.ts`

### Phase 2：Widget SDK 扩展（2-3h）
- [ ] 扩展 `ControlField.label` 类型为 `string | I18nLabel`
- [ ] 改造 `control-panel-builder.ts` — 分组名改用 i18n key
- [ ] 改造 `generate-controls.ts` — 同上
- [ ] 新增 `resolveLabel()` 工具函数
- [ ] 修改 `ControlFieldRow.tsx` 使用 `resolveLabel`

### Phase 3：Widget 独立翻译（3-4h）
- [ ] 为 6 个 Widget 创建 `locales/zh.json` + `locales/en.json`
- [ ] 迁移 `text/controls.ts` (~40 个 label)
- [ ] 迁移 `rectangle/controls.ts` + `circle/controls.ts` + `line/controls.ts`
- [ ] 迁移 `echarts-line/controls.ts` + `image/controls.ts`
- [ ] 修改 `widgetResolver.ts` — 加载 Widget 时注册翻译资源

### Phase 4：页面迁移（3-4h）
- [ ] 提取页面文本到 `pages.json` (zh/en)
- [ ] 迁移 `LoginPage.tsx` (~15 处硬编码)
- [ ] 迁移 `RegisterPage.tsx`
- [ ] 迁移 `DataSourcesPage.tsx` + DataSourceConfig/* (11 files)
- [ ] 迁移 `PreviewPage.tsx` / `EmbedPage.tsx` / `ImageUploadSettingsPage.tsx`
- [ ] 迁移 `AuthContext.tsx` / `ProjectContext.tsx`

### Phase 5：清理与防护（1-2h）
- [ ] 删除所有 `type Language = "zh" | "en"` 定义
- [ ] 删除所有 `labelZh()` / `labelEn` 旧模式
- [ ] 删除所有 `language` prop
- [ ] 添加自动检查脚本 `pnpm i18n:check-all`
- [ ] 语言偏好持久化到 localStorage
- [ ] CI 添加 i18n 完整性检查 Gate

---

## 质量保证

### 三道自动化防线

| 防线 | 命令 | Phase 5 后预期 |
|------|------|---------------|
| 中文泄漏检测 | `pnpm i18n:check-leaks` | **0 泄漏** |
| 旧模式检测 | `pnpm i18n:check-old-patterns` | **0 残留** |
| 翻译完整性 | `pnpm i18n:check-completeness` | **0 缺失 key** |

### Phase Gate（每个 Phase 完成后必须通过）

1. `pnpm typecheck` — TypeScript 零错误
2. `pnpm i18n:check-all` — 三道防线全过
3. `pnpm build` — 全量构建成功
4. `npx playwright test` — E2E 测试通过

---

## 验收标准

1. 编辑器右上角语言切换按钮可正常切换 zh/en
2. 切换后所有 UI 文本（菜单、按钮、面板标题、字段标签、表单、错误消息）同步变化
3. Widget 属性面板中的分组名/字段名/选项文本随语言切换变化
4. 登录/注册 等页面全部支持双语
5. 刷新页面后语言选择保持
6. `pnpm i18n:check-all` 三道防线全部通过
7. 翻译文件结构支持未来扩展更多语言
8. 通过 **47 项逐页验收清单**（详见完整方案文档）
