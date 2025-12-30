# Spec-Kit 执行命令与验证（Superset 风格优先）

本目录提供一套可直接照着执行的 Spec-Kit 工作流文档。

## 1. 在哪里执行

- 在 VS Code 打开 Copilot Chat
- 依次复制粘贴并执行本目录中的四个文件内容：
  1) `speckit-specify.md`
  2) `speckit-plan.md`
  3) `speckit-tasks.md`
  4) `speckit-implement.md`

> 提示：这些文件内已经包含 `/speckit.*` 命令与正文，你只需要复制整段到 Copilot Chat。

## 2. 终端命令（本地验证）

在项目根目录（有 `pnpm-workspace.yaml` 的目录）执行：

- 安装依赖：
  - `pnpm install`

- 启动 Studio：
  - `pnpm dev`

- 只启动 Preview（可选）：
  - `pnpm dev --filter ./apps/preview`

- 类型检查：
  - `pnpm typecheck`

- 运行单测（如果仓库已有）：
  - `pnpm test`

## 3. 最小验收步骤（建议）

1) 启动 Studio：`pnpm dev`
2) 打开数据源面板，创建一个 Static JSON 数据源，例如：`{ "val": "Hello" }`
3) 拖入 `basic-text` 文本组件
4) 在属性面板中，对 text 字段使用 Field Picker：选择 `ds.<id>.data.val`
5) 验证：
   - 面板显示该字段处于 Bound 状态（并能看到来源）
   - 画布上文本显示 `Hello`

## 4. 常见问题

- 如果某组件仍显示旧手写面板：说明该插件尚未提供 `entry.controls`，属于预期 fallback。
- 如果数据源字段树为空：确认数据源已连接/Static JSON 已保存，并且 runtime data 非空。
- 如果绑定后画布不更新：检查 `node.schemaRef.data` 是否写入，且 `PropertyResolver` 是否覆盖到对应 prop。
