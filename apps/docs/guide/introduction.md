# 平台介绍

ThingsVis 是一个面向工业与 IoT 场景的开源可视化工作台，用来快速搭建大屏、嵌入业务页面和扩展自定义 Widget。

它把三个核心能力放在同一个仓库里：

- 画布式 Studio
- 可嵌入的运行时
- 可扩展的 Widget 开发体系

![ThingsVis Studio](/images/guide/standalone-editor.png)

## 这个项目适合做什么

你可以用 ThingsVis 来做：

- 运维大屏
- IoT 设备监控页面
- 宿主业务系统中的可视化子页面
- 可扩展的自定义组件平台

## 项目由哪些部分组成

### Studio

用于：

- 画布编辑
- 组件拖拽布局
- 属性配置
- 数据绑定
- 预览和保存

### Embed Runtime

用于：

- 通过 iframe 接入第三方系统
- 接收宿主消息
- 由宿主推送 token、dashboard 数据和平台字段

### Widget SDK

用于：

- 定义组件属性
- 生成属性面板
- 实现组件渲染逻辑
- 让第三方开发者扩展组件生态

## 仓库结构概览

- `apps/studio`：Studio 编辑器与预览运行时
- `apps/docs`：VitePress 文档站
- `packages/thingsvis-kernel`：无头运行时与状态管理
- `packages/thingsvis-schema`：共享 Schema 与契约
- `packages/thingsvis-ui`：运行时 UI 层
- `packages/thingsvis-widget-sdk`：Widget 开发 SDK
- `packages/widgets`：内置组件集合
- `tools/cli`：`vis-cli`

## 推荐阅读顺序

1. [快速开始](/guide/getting-started)
2. [独立模式创建大屏](/guide/standalone-dashboard)
3. [属性面板与组件配置](/guide/component-configuration)
4. [数据源配置](/guide/datasource-configuration)
5. [嵌入模式接入指南](/guide/embed-dashboard)
6. [Widget 开发总览](/development/widget-development)
