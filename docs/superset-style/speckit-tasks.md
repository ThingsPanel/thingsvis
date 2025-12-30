# SpecKit Tasks: Superset 风格优先的数据配置与绑定（ThingsVis）

将以下内容复制到 Copilot Chat 中执行：

/speckit.tasks
## 任务列表（按最小闭环优先）

- [ ] T001 在 `packages/thingsvis-schema` 中新增 Controls Schema 类型（React-free）并导出
  - 新增：`PluginControls` / `ControlField` / `BindingMode` / `ControlGroup`
- [ ] T002 扩展插件协议：在 `packages/thingsvis-schema/src/plugin-module.ts` 中为 `PluginMainModule` 增加可选 `controls?: PluginControls`
- [ ] T003 Studio 侧实现动态 PropsPanel（优先支持 controls）
  - 若存在 `entry.controls`：动态渲染字段输入控件
  - 若不存在：保持现有手写面板 fallback
- [ ] T004 在 Studio 实现统一的“绑定状态 UI”（字段级）
  - 显示：Static / Bound
  - Bound 模式下支持：Field Picker 与 Expression Editor
  - 写入/更新绑定：落到 `node.schemaRef.data: DataBinding[]`
- [ ] T005 实现 Field Picker（最小可用）
  - 从 `kernelStore.getState().dataSources[id].data` 生成字段树/列表
  - 限制：最大深度、最大节点数（避免大 JSON 卡顿）
  - 生成 expression：`{{ ds.<id>.data.<path> }}`
- [ ] T006 为 `plugins/basic/text` 增加 `controls` 声明（作为样板）
  - 字段：text / fill / fontSize（后续可扩展 fontWeight/textAlign/fontFamily）
- [ ] T007 打通端到端验收
  - 创建 Static JSON 数据源（如 `{ "val": "Hello" }`）
  - 绑定 text → `ds.<id>.data.val`（通过 Field Picker，不手写表达式）
  - 验证画布渲染与面板一致

## Done 定义
- basic-text 通过 Field Picker 绑定 text 后，画布实时显示数据源字段值。
- 对已绑定字段：面板清晰展示绑定来源，并可切换回静态值。
- 不破坏旧的 `node.data` 与 `{{ }}` 机制。
