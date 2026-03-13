# 快速开始

本页目标是让你用最短路径把 ThingsVis 跑起来，并知道下一步该看哪篇文档。

## 环境要求

- Node.js `>=20.10.0`
- pnpm `>=9`

## 启动最小可运行环境

```bash
pnpm install
pnpm build:widgets
pnpm dev
```

这会启动：

- `studio`
- `@thingsvis/kernel`

这是前端可独立运行的开发模式，适合以下场景：

- 先熟悉编辑器
- 本地创建和调试页面
- 进行 Widget 开发联调

## 需要后端时怎么启动

如果你要体验认证、项目管理或其他依赖后端的完整链路，再启动完整应用：

```bash
pnpm dev:app
```

## 本地文档站

```bash
pnpm docs:dev
```

![Studio 编辑器](/images/guide/standalone-editor.png)

## 推荐阅读顺序

1. [平台介绍](/guide/introduction)
2. [独立模式创建大屏](/guide/standalone-dashboard)
3. [属性面板与组件配置](/guide/component-configuration)
4. [数据源配置](/guide/datasource-configuration)
5. [嵌入模式接入指南](/guide/embed-dashboard)
6. [Widget 开发总览](/development/widget-development)

## 常用命令

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```
