# 属性面板与组件配置

本页说明 Studio 右侧属性面板的工作方式，以及组件属性、数据绑定和表达式之间的关系。

## 属性面板的来源

在 ThingsVis 中，属性面板不是手写表单堆出来的。

它通常来自 Widget 的两部分定义：

- `schema.ts`：定义属性结构和默认值
- `controls.ts`：定义右侧面板的分组、控件类型和绑定能力

因此用户在 Studio 中看到的属性面板，本质上是组件契约的一部分。

![属性面板示例](/images/guide/component-panel.png)

## 三种常见配置模式

当前实现中，组件字段通常有三种模式：

- `static`
- `field`
- `expr`

### static

直接填写固定值，例如：

- 标题文本
- 颜色
- 数值

### field

把字段绑定到某个数据源路径，常见表达式格式为：

```text
{{ ds.weather_api.data.temperature }}
```

### expr

直接输入表达式，适合更灵活的计算或拼接。

## 当前权威字段绑定格式

字段绑定表达式的权威格式是：

```text
{{ ds.<dataSourceId>.data.<fieldPath> }}
```

例如：

```text
{{ ds.weather_api.data.temperature }}
{{ ds.__platform__.data.status }}
{{ ds.__platform__.data.temperature__history }}
```

## 分组与控件

组件作者可以把字段组织到不同分组中，常见分组包括：

- `Content`
- `Style`
- `Data`
- `Advanced`

这会直接影响 Studio 里右侧面板的可读性和使用成本。

## 什么适合做静态配置，什么适合做绑定

通常建议：

- 纯视觉风格适合静态值
- 实时数据展示适合字段绑定
- 复杂派生值适合表达式模式

## 事件与动作

属性面板之外，组件还可能配置：

- 事件
- 动作

例如某些交互型 Widget 会在点击、切换、拖动时触发行为。

因此你需要把“属性配置”和“事件配置”分开理解。

## 面向组件作者的建议

如果你在开发 Widget：

- 用 `schema.ts` 保证默认值和类型边界清晰
- 用 `controls.ts` 把面板按用户认知组织好
- 不要把所有字段都塞进一个分组
- 只为真正需要的字段开启 binding
