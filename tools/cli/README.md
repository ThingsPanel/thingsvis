# @thingsvis/cli

ThingsVis 组件开发命令行工具，用于创建、验证、构建和调试组件。

## 安装

CLI 已包含在 monorepo 中，无需额外安装。通过 `pnpm` 脚本调用即可。

## 命令

### create — 创建组件骨架

```bash
pnpm vis-cli create <category> <name> [--port <port>]
```

- `category` — 组件分类：`basic` | `chart` | `interaction` | `media` | `data` | `layout` | `indicator` | `geo` | `custom`
- `name` — 组件名称，kebab-case 格式（如 `my-widget`）
- `--port` — 可选，开发服务器端口号（默认交互式询问）

生成目录：`packages/widgets/<category>/<name>/`

生成文件结构：
```
src/
  index.ts        # defineWidget 入口
  schema.ts       # Zod 属性定义 + getDefaultProps()
  metadata.ts     # 组件元数据（id/name/category/icon 等）
  controls.ts     # 控件面板配置（generateControls）
  locales/
    zh.json       # 中文翻译
    en.json       # 英文翻译
package.json
tsconfig.json
rspack.config.ts
```

### validate — 验证组件规范

```bash
pnpm vis-cli validate <widget-path-or-id>
```

- `widget-path-or-id` — 组件路径或 ID（如 `basic/text` 或 `packages/widgets/basic/text`）

检查项：
- `package.json` 存在且含 `name`/`version`
- `src/index.ts` 存在且导出 `Main` 或调用 `defineWidget`
- `src/schema.ts` 使用 `z.object()` 且含 `parse({})` 默认值工厂
- `src/controls.ts` 使用 `generateControls()` 或 `createControlPanel()`
- `src/locales/zh.json` 与 `en.json` 键名一致

### build — 构建单个组件

```bash
pnpm vis-cli build <widget-path-or-id>
```

在组件目录执行 `pnpm build`。

### dev — 启动开发服务器

```bash
pnpm vis-cli dev <widget-path-or-id>
```

在组件目录执行 `pnpm dev`，启动 Rspack 开发服务器。
