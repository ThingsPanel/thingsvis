# SpecKit Specify: Superset 风格优先的数据配置与绑定（ThingsVis）

> 目标：把 ThingsVis 的“表达式绑定能力”升级为 **Superset 风格优先** 的数据配置体验：
> - 普通用户优先使用「数据源 → 字段选择/映射 → 组件渲染」的结构化流程
> - 高级用户仍可使用 `{{ }}` 表达式兜底
> - 组件（插件）必须显式声明哪些字段可绑定、绑定方式、面板分组与控件类型

将以下内容复制到 Copilot Chat 中执行：

/speckit.specify
在 ThingsVis 中实现“Superset 风格优先”的组件数据配置最佳实践：

1) 将“数据源(DataSource)”与“组件配置(Props/Style)”解耦：数据源是全局实体，组件只消费数据源快照。
2) 提供“字段选择器(Field Picker)”与“字段映射(Mapping)”体验：用户不需要手写表达式也能绑定到 `ds.<id>.data.<path>`。
3) 保留表达式 `{{ ... }}` 作为高级兜底（兼容现有 PropertyResolver 与 DataBinding）。
4) 组件必须声明自身的“Controls/面板定义”：字段分组（Content/Style/Data/Advanced）、控件类型（number/color/select 等）、默认值、以及绑定策略（static/field/expr/rule）。
5) Studio 的属性面板从组件 Controls 动态生成，而不是手写字段；且面板必须能清晰展示某字段是否被绑定覆盖。

约束与兼容性要求：
- 单仓库 pnpm + Turbo；TypeScript 5.x 严格模式。
- schemas 位于 packages/thingsvis-schema，继续使用 Zod 做验证。
- 渲染纪律：Leafer/Overlay 体系不变；属性解析仍由 @thingsvis/ui 的 PropertyResolver 统一完成。
- 不破坏现有 node.schemaRef.props、node.schemaRef.data(DataBinding[]) 的存量页面；新能力需要渐进式接入。

验收场景（最小闭环）：
- 以 basic-text 文本组件为样板：text 字段可通过 Field Picker 绑定，fill/fontSize 等样式默认静态但可切换到绑定；面板显示“当前为静态/绑定”并且画布渲染与面板一致。
