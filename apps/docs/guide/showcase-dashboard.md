# 示例大屏

本页提供一个可直接导入 Studio 的示范大屏，用来展示 ThingsVis 在当前开源版本下可实现的 DataV 风格编排效果。

## 示例概览

- 名称：`城市运行监测中心`
- 画布：`1920 × 1080`
- 模式：`fixed`
- 数据：全部使用内嵌模拟数据
- 组件：`value-card`、`text`、`table`、`echarts-bar`、`echarts-line`、`echarts-pie`、`echarts-gauge`、`uplot-line`

## 下载示例工程

- [下载示例工程](/examples/city-operations-command-center.thingsvis.json)

## 编辑器视图

![城市运行监测中心编辑器截图](/images/showcase/city-ops-editor.png)

## 预览视图

![城市运行监测中心预览截图](/images/showcase/city-ops-preview.png)

## 你可以从这个示例学到什么

- 如何用现有内置组件组织出完整的大屏层次
- 如何用 `value-card` 和图表组件做顶部指标区与主分析区
- 如何在不依赖后端接口的情况下，用模拟数据完成展示资产
- 如何把示范工程作为团队内部模板继续二次修改

## 导入方式

1. 启动 Studio：

```bash
pnpm install
pnpm build:widgets
pnpm dev
```

2. 打开 Studio 后，进入项目导入或本地项目管理流程。
3. 选择 [`city-operations-command-center.thingsvis.json`](/examples/city-operations-command-center.thingsvis.json)。
4. 导入后即可在编辑器中继续调整布局、文本、图表数据和配色。

## 设计说明

这个示例没有新增任何底层能力，而是严格基于当前仓库中已经存在的 Widget 体系拼装而成。

因此它更适合做：

- README 展示资产
- 开源仓库的默认示例工程
- 团队演示环境的起始模板

而不是作为“唯一最佳实践”去限制后续视觉方向。
