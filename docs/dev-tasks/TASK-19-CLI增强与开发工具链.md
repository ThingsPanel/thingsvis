# TASK-19：CLI 增强与开发工具链

> **优先级**：🟢 P2
> **预估工时**：1.5-2 人天
> **前置依赖**：TASK-14（SDK 类型定义稳定后）

---

## 背景

`vis-cli` 目前只有 `create` 命令。Widget 开发者需要独立预览、构建验证、合规检查等工具。

---

## 任务清单

### vis-cli validate（0.5 天）
- [ ] 新增 `vis-cli validate <widget-path>` 命令
- [ ] 检查项：
  - `package.json` 存在且含 `name`, `version`, `thingsvis.componentId`
  - `src/index.ts` 导出 `Main` 对象
  - `Main` 包含必需字段：`id`, `name`, `schema`, `controls`, `createOverlay`
  - `schema` 为有效 Zod Schema（能 `.parse({})` 不抛异常）
  - `controls` 通过 `WidgetControlsSchema.safeParse()` 验证
  - 如有 `locales`，验证所有语言的 key 集合一致
- [ ] 输出 pass/fail 报告

### vis-cli dev（0.5 天）
- [ ] 新增 `vis-cli dev <widget-path>` 命令
- [ ] 启动一个简易 HTML 页面，加载单个 Widget 并渲染
- [ ] 提供属性编辑 sidebar（基于 Widget 的 controls 自动生成）
- [ ] 支持 hot reload

### vis-cli build（0.5 天）
- [ ] 新增 `vis-cli build <widget-path>` 命令
- [ ] 独立构建单个 Widget 为 Module Federation remote bundle
- [ ] 输出到 `dist/` 目录

---

## 验收标准

1. `vis-cli validate widgets/chart/echarts-line` 输出 ✅ 全部检查通过
2. `vis-cli dev widgets/chart/echarts-line` 打开浏览器展示单 Widget 预览
3. `vis-cli build widgets/chart/echarts-line` 生成可加载的 bundle
