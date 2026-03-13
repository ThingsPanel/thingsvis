# 5 分钟创建第一个 Widget

本页给你一条最短路径：从脚手架生成，到在 Studio 里看到自己的第一个 Widget。

如果你想先看完整背景，再读：

- [Widget 开发总览](/development/widget-development)

## 前提

先确保工作区已经准备好：

```bash
pnpm install
pnpm build:widgets
pnpm dev
```

这里的 `pnpm dev` 是前端独立运行模式，足够用于大多数 Widget 开发联调。

## 第一步：生成脚手架

当前推荐命令是：

```bash
pnpm vis-cli create <category> <name>
```

例如：

```bash
pnpm vis-cli create chart line-chart
```

脚手架会在 `packages/widgets/<category>/<name>/` 下生成一个新组件包。

## 第二步：理解最重要的几个文件

生成后的核心文件通常包括：

- `src/schema.ts`
- `src/controls.ts`
- `src/metadata.ts`
- `src/index.ts`
- `src/locales/zh.json`
- `src/locales/en.json`

它们分别负责：

- `schema.ts`：定义属性结构和默认值
- `controls.ts`：定义右侧属性面板
- `metadata.ts`：描述组件元信息
- `index.ts`：实现组件运行时逻辑

## 第三步：定义属性

`schema.ts` 里通常会用 Zod 定义属性。

例如：

```ts
import { z } from 'zod';

export const PropsSchema = z.object({
  title: z.string().default('示例标题'),
  color: z.string().default('#1677ff'),
  value: z.number().default(42),
});

export type Props = z.infer<typeof PropsSchema>;
```

这一步决定了：

- 字段类型
- 默认值
- 组件运行时接收到的 props 结构

## 第四步：生成属性面板

`controls.ts` 负责告诉 Studio 如何显示右侧属性面板。

例如：

```ts
import { generateControls } from '@thingsvis/widget-sdk';
import { PropsSchema } from './schema';

export const controls = generateControls(PropsSchema, {
  groups: {
    Content: ['title', 'value'],
    Style: ['color'],
  },
  overrides: {
    color: { kind: 'color' },
  },
  bindings: {
    value: { enabled: true, modes: ['static', 'field', 'expr'] },
  },
});
```

这一步决定了：

- 字段在哪个分组出现
- 字段使用什么控件
- 字段是否支持绑定

## 第五步：实现组件渲染

`index.ts` 里推荐使用 `defineWidget`：

```ts
import { defineWidget } from '@thingsvis/widget-sdk';
import { PropsSchema } from './schema';
import { controls } from './controls';
import { metadata } from './metadata';

export const Main = defineWidget({
  ...metadata,
  schema: PropsSchema,
  controls,
  render: (el, props) => {
    const div = document.createElement('div');
    div.textContent = `${props.title}: ${props.value}`;
    div.style.color = props.color;
    el.appendChild(div);

    return {
      update: (nextProps) => {
        div.textContent = `${nextProps.title}: ${nextProps.value}`;
        div.style.color = nextProps.color;
      },
      destroy: () => {
        el.innerHTML = '';
      },
    };
  },
});

export default Main;
```

## 第六步：联调和校验

常见联调命令：

```bash
pnpm vis-cli validate <widget-path-or-id>
pnpm vis-cli dev <widget-path-or-id>
```

如果你只是在 monorepo 里开发并联调 Studio，通常也会配合：

```bash
pnpm build:widgets
pnpm dev
```

## 第七步：在 Studio 中验证

重点看三件事：

- 组件是否能正常出现在组件库中
- 拖入画布后是否能正常渲染
- 右侧属性面板是否和 `schema.ts` / `controls.ts` 一致

## 下一步看什么

- [Widget 开发总览](/development/widget-development)
- [属性面板与组件配置](/guide/component-configuration)
- 仓库文件：`tools/cli/README.md`
- 仓库文件：`packages/thingsvis-widget-sdk/README.md`

## Studio 联调参考

组件开发完成后，先确认组件库中已经能看到对应分类和卡片：

![Studio 组件库](/images/development/widget-library.png)

再确认右侧属性面板的结构、分组和默认值与 `schema.ts` / `controls.ts` 保持一致：

![Studio 属性面板](/images/guide/component-panel.png)
