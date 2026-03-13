# 独立模式创建大屏

本页介绍如何在不依赖宿主系统的情况下，直接使用 Studio 从 0 到 1 创建一个大屏。

## 适用场景

- 本地搭建和调试看板
- 独立运行的可视化页面
- 先完成画面和数据流设计，再考虑后续嵌入

## 典型流程

1. 启动 Studio
2. 创建或打开一个项目
3. 拖入组件
4. 配置画布和组件属性
5. 添加数据源
6. 绑定字段或表达式
7. 预览和保存

## 第一步：启动 Studio

```bash
pnpm install
pnpm build:widgets
pnpm dev
```

这一步启动的是前端独立运行模式，不依赖后端。

## 第二步：创建项目

进入 Studio 后，创建一个新项目或打开现有项目。

在独立模式下，你通常会直接在 Studio 内完成：

- 画布尺寸设置
- 组件拖拽布局
- 变量定义
- 数据源配置
- 预览和保存

## 第三步：拖入组件

从左侧组件库将组件拖入画布。

![Studio 编辑器](/images/guide/standalone-editor.png)

如果你不想从空白画布开始，也可以直接基于现成样例继续修改：

- [查看示例大屏](/guide/showcase-dashboard)
- [下载示例工程](/examples/city-operations-command-center.thingsvis.json)

当前仓库已经包含多类内置组件，例如：

- basic
- chart
- interaction
- media

## 第四步：配置画布和组件属性

重点使用右侧属性面板完成：

- 文本和样式
- 尺寸和布局
- 数据绑定
- 事件与动作

详细说明见：

- [属性面板与组件配置](/guide/component-configuration)

## 第五步：添加数据源

在数据源中心中添加：

- `STATIC`
- `REST`
- `WS`

然后把组件属性绑定到对应字段。

详细说明见：

- [数据源配置](/guide/datasource-configuration)

## 第六步：预览和保存

完成布局和绑定后，进入预览验证：

- 组件是否正确渲染
- 数据是否正常进入
- 事件和动作是否按预期触发

如果你使用的是需要后端支持的项目模式，也可以结合 `pnpm dev:app` 运行完整链路。

## 常见问题

### 组件没显示

先确认是否已执行：

```bash
pnpm build:widgets
```

### 数据没更新

优先检查：

- 数据源是否连接成功
- 绑定表达式是否正确
- 字段路径是否存在

### 想嵌入到第三方系统

请不要继续沿用独立模式思路，直接阅读：

- [嵌入模式接入指南](/guide/embed-dashboard)
