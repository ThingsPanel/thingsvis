# SpecKit Implement: Superset 风格优先的数据配置与绑定（ThingsVis）

将以下内容复制到 Copilot Chat 中执行：

/speckit.implement
实现 `docs/superset-style/speckit-tasks.md` 中的任务，遵循：

- 渐进式改造：PropsPanel 先支持 `entry.controls`，对未提供 controls 的组件保留旧 UI。
- 不破坏存量：仍使用 `node.schemaRef.data: DataBinding[]` + `PropertyResolver` 作为运行时绑定机制。
- Superset 风格优先：Field Picker 默认入口；Expression Editor 作为高级兜底。
- 性能约束：字段树生成需限制深度/节点数；避免对巨大 JSON 全量展开。

实现细则（建议）：

1) schema 包新增 controls 类型
- 新增 `packages/thingsvis-schema/src/plugin-controls.ts`
- 在 `packages/thingsvis-schema/src/index.ts` 导出
- `PluginMainModule` 增加 `controls?: PluginControls`

2) Studio 动态面板
- 在 `apps/studio/src/components/RightPanel/PropsPanel.tsx` 中：
  - 获取当前 node.type 对应 plugin entry（可复用已有 loader 或缓存）
  - 根据 `entry.controls` 生成表单

3) 绑定写入策略
- 用 `node.schemaRef.data` 存储 bindings（兼容现有 resolver）
- 每个字段 binding 存储：`targetProp`（短期：用 controls 的 path 或简化到 key） + `expression`

4) Field Picker
- 从 kernel store dataSources 的 runtime data 构建字段路径
- 选择后生成表达式并写入 binding

5) basic-text 样板
- 在 `plugins/basic/text/src/spec.tsx` 或独立文件中导出 `controls`
- 确保在 Studio 面板中展示，并可绑定 text

验收：
- 使用 Static JSON 数据源，将 text 绑定到某字段；画布与面板一致。
