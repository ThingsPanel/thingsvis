# SpecKit Plan: Superset 风格优先的数据配置与绑定（ThingsVis）

将以下内容复制到 Copilot Chat 中执行：

/speckit.plan
## 1. 设计目标（Superset 风格优先）

在不牺牲现有表达式能力的前提下，优先提供结构化的“数据选择/映射”体验：

- **普通用户路径**：选择数据源 → 从字段树选择路径 → 绑定到组件字段 → 立即预览
- **高级用户路径**：仍可用 `{{ ... }}`（表达式/计算/拼接），但 UI 上作为“高级模式”

## 2. 现状对齐（基于现有代码）

- DataSource 与 DataBinding 已存在于 schema：`DataBinding = { targetProp, expression }`，节点上通过 `node.data` 挂载。
- 运行时解析集中在 UI 引擎：`PropertyResolver.resolve(node, dataSources)` 支持：
  - props 里内联 `{{ }}`
  - node.data 显式绑定覆盖 targetProp
- 插件 schema(Zod) 目前主要用于默认值提取，Studio PropsPanel 仍是手写字段。

## 3. 核心方案：新增“Controls Schema”与“Binding UI 模式”

### 3.1 Controls Schema（组件面板声明）

为插件增加一个可序列化的“Controls Schema”（React-free），用于 Studio 动态生成属性面板。

建议新增类型（放在 `packages/thingsvis-schema`，并导出）：

- `PluginControls`：组件面板定义（分组 + 字段）
- `ControlField`：字段定义
  - `path`: string（建议用 `props.xxx` / `style.xxx` 这种全路径；短期也可用 `xxx` 兼容 targetProp）
  - `label`: string
  - `kind`: 'string'|'number'|'boolean'|'color'|'select'|'json'
  - `options?`: select 的枚举项
  - `default?`: 默认值（可与 zod default 互补，但以 zod 为权威）
  - `binding`: { enabled: boolean; modes: ('static'|'field'|'expr'|'rule')[] }
  - `group`: 'Content'|'Style'|'Data'|'Advanced'

> 说明：Zod 负责类型/校验/默认值；Controls 负责 UI 形态与绑定策略。

### 3.2 Binding Modes（绑定模式）

- `static`：普通输入/选择器
- `field`（Superset 风格优先）：从 `ds.<id>.data` 的实际 JSON 快照生成字段树，选择路径后生成表达式：
  - `{{ ds.<id>.data.<path> }}`
- `expr`：手写表达式编辑器（高级兜底）
- `rule`：条件规则（后续阶段；可先预留类型）

短期兼容策略：
- 仍把最终绑定结果落到 `node.data: DataBinding[]` 上（不破坏现有 PropertyResolver）
- `field` 只是 UI 帮你生成 expression 字符串

## 4. Studio 属性面板改造策略（渐进式）

- PropsPanel 读取当前选中节点类型对应的插件 entry：
  - 如果存在 `entry.controls`：按 controls 动态渲染字段
  - 否则 fallback 到现有手写面板（避免一次性改完所有组件）

面板一致性要求：
- 每个字段展示“静态值”与“绑定状态”
- 如果字段被绑定覆盖，面板必须能看到绑定表达式/字段来源

## 5. Field Picker 的实现（最小可用）

- 数据源来自 kernel store：`kernelState.dataSources[id].data`（runtime snapshot）
- 使用一个轻量工具把 JSON 对象展开为 dot-path 列表/树（限制深度与数量，避免大对象卡 UI）
- 选择路径后：
  - 写入/更新对应 `node.data` binding：`{ targetProp: <target>, expression: '{{ ds.<id>.data.<path> }}' }`

## 6. 样板组件：basic-text

- 为 basic-text 增加 `controls`：
  - Content: `props.text`（binding modes: static + field + expr）
  - Style: `props.fill`（static + field + expr，默认静态），`props.fontSize`（static）
  - 后续：fontWeight/textAlign/fontFamily

## 7. 验证与测试

- 手工验证：启动 Studio，拖入 basic-text，使用 Field Picker 绑定 text 到静态数据源字段，画布实时更新。
- 兼容验证：旧页面中仍能通过 node.data / `{{ }}` 工作。
- 单元测试（可选）：对 JSON path 展开工具、binding 写入/更新逻辑做纯函数测试。
