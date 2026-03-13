# Widget 开发总览

本页给出当前推荐的 Widget 开发路径，适合作为二次开发总入口。

## 当前推荐路径

ThingsVis 当前推荐的 Widget 开发方式是：

1. 用 `vis-cli` 生成脚手架
2. 在 `schema.ts` 中定义属性结构
3. 在 `controls.ts` 中定义属性面板
4. 用 `defineWidget` 实现渲染逻辑
5. 在 Studio 中联调

## 第一步：创建 Widget

```bash
pnpm vis-cli create <category> <name>
```

例如：

```bash
pnpm vis-cli create chart line-chart
```

## 第二步：理解生成结构

脚手架通常会生成这些核心文件：

- `src/schema.ts`
- `src/controls.ts`
- `src/metadata.ts`
- `src/index.ts`
- `src/locales/zh.json`
- `src/locales/en.json`

## 第三步：定义属性

`schema.ts` 负责：

- 定义字段类型
- 设置默认值
- 为运行时和属性面板提供契约

## 第四步：生成属性面板

`controls.ts` 负责：

- 分组字段
- 定义控件类型
- 控制哪些字段支持绑定

## 第五步：实现运行时逻辑

`defineWidget` 负责：

- 接收属性
- 创建 DOM 容器
- 实现 `update`
- 实现 `destroy`

## 第六步：在 Studio 中联调

常见流程：

```bash
pnpm build:widgets
pnpm dev
```

这里的 `pnpm dev` 仍然是前端独立运行模式，足够用于大多数 Widget 联调。

如果你还需要单独调试某个组件包，也可以用：

```bash
pnpm vis-cli dev <widget-path-or-id>
pnpm vis-cli validate <widget-path-or-id>
```

## 你最该先读哪几份材料

- [Widget 快速入门](/development/quick-start)
- 仓库文件：`tools/cli/README.md`
- 仓库文件：`packages/thingsvis-widget-sdk/README.md`

## 设计边界

开发 Widget 时建议记住这几条：

- 共享契约进 `@thingsvis/schema`
- 不要把旧版 Widget 入口模式继续当主线
- 让 `schema` 和 `controls` 保持一致
- 优先做清晰、可绑定、可调试的属性面板

## Studio 联调界面

下面这张图可以作为联调时的参考视图：左侧是组件库，右侧是属性面板，中间是画布。

![Studio 中的 Widget 联调界面](/images/development/widget-in-studio.png)

> `vis-cli create` 的终端输出截图仍待补充；如果你希望把 CLI 也做成图文教程，建议后续补一张真实命令执行截图。
