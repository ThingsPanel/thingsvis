# TASK-20：Widget 开发者文档门户

> **优先级**：🟢 P2
> **预估工时**：2-3 人天
> **前置依赖**：TASK-14（SDK API 稳定后）、TASK-19（CLI 工具就绪后）

---

## 背景

当前 Widget 开发指南仅有 SDK 目录下的 README。开源社区需要完整文档降低参与门槛。

---

## 任务清单

### 文档站搭建（0.5 天）
- [ ] 使用 VitePress 初始化文档站（`docs/guide/`）
- [ ] 配置导航、侧边栏、搜索
- [ ] 部署到 GitHub Pages

### 内容编写（2 天）
- [ ] **快速入门**：5 分钟创建第一个 Widget（vis-cli create → 写 render → 预览）
- [ ] **SDK API 参考**
  - `defineWidget()` 完整参数说明
  - `createControlPanel()` Builder 链式 API
  - `generateControls()` 自动生成
  - 22 种内置 ControlKind 使用指南（每种附截图）
  - 自定义控件渲染器（`controlRenderers`）教程
  - 6 种 Mixin（Transform/Shadow/Border/Background/Text/Animation）
- [ ] **主题适配指南**：如何读取 `ctx.theme` 并适配暗色模式
- [ ] **数据绑定教程**：static / field / expr 三种模式说明
- [ ] **组件间通信**：`ctx.emit` / `ctx.on` 使用方式
- [ ] **i18n 本地化**：如何为 Widget 添加多语言翻译
- [ ] **版本迁移**：如何使用 `migrate` 函数处理 props 升级
- [ ] **最佳实践**
  - 性能优化（ECharts setOption 策略、ResizeObserver 节流）
  - 项目结构约定
  - 常见错误与排查

---

## 验收标准

1. 文档站可在线访问（GitHub Pages）
2. 新开发者按快速入门可在 10 分钟内完成第一个 Widget
3. API 参考覆盖 SDK 所有公开导出
4. 每种 ControlKind 有截图和用法示例
