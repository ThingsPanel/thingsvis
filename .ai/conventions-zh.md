# ThingsVis 工程约定

本文档定义本仓库默认的工程约定。
它不是通用模板，而是结合优秀 TypeScript Monorepo / UI 开源项目的通用实践，
再收敛到 `thingsvis` 当前真实使用的结构与约束。

如果任务 spec、维护者指令或子系统既有契约与本文冲突，优先遵循更具体的来源。

## 1. 优先级

按以下顺序执行：

1. 维护者或 reviewer 的明确指令
2. `.ai/specs/` 中已批准的任务 spec
3. 被修改模块现有的公开契约
4. 本 conventions 文件
5. 个人偏好

默认原则：优先做小范围、可回滚、保持契约稳定的修改。

## 2. 仓库基线

- 包管理器：`pnpm@9.x`
- Node：`>=20.10.0`
- 语言：TypeScript 优先
- 测试：`vitest`
- 格式化：`prettier`
- 大多数包的构建：`rspack`
- 仓库结构：`apps/`、`packages/`、`tools/` 的 pnpm workspace monorepo

在引入新工具、新依赖或新写法前，先确认仓库里是否已经有成熟先例。
默认先匹配本地既有风格，再考虑扩展。

## 3. Monorepo 分层边界

必须尊重包职责边界，避免跨层污染。

- `packages/thingsvis-schema`：共享数据契约与类型
- `packages/thingsvis-kernel`：运行时逻辑、执行、状态、绑定
- `apps/studio`：编辑器 UI 与创作流程
- `apps/server`：后端与持久化
- `packages/widgets/*`：内置组件与组件本地资源
- `tools/`：CLI 与构建工具

规则：

- 共享契约放进 `@thingsvis/schema`，不要散落在 app 私有目录。
- UI 行为不要下沉进 kernel 包。
- 不要深层导入 sibling package 的内部源码文件，优先走包公开出口。
- 遵守现有 ESLint 限制，不要直接导入：
  `packages/thingsvis-ui/src/*`、
  `packages/thingsvis-kernel/src/*`、
  `packages/thingsvis-schema/src/*`。

## 4. 变更范围控制

- 每次变更只解决一个明确问题。
- 不要把功能、重构、格式化和文档清理混在一个改动里，除非它们强相关。
- 不要为了“顺手统一风格”去重写邻近文件。
- 工作区脏的时候，不得覆盖与当前任务无关的用户改动。
- 只要动到共享契约，就要考虑下游调用方是否会受影响。

## 5. TypeScript 与代码风格

先遵循当前模块既有风格，再应用这些默认规则：

- 可读性优先于炫技。
- 函数应足够短，能在一个连续阅读块内看清主逻辑。
- 优先使用 guard clause，避免过深嵌套。
- 避免一个布尔参数承载多种不相关行为。
- 几何、转换、解析、映射逻辑优先拆成纯函数辅助方法。
- 只有在意图不明显时才加注释。
- 源码注释必须使用英文。
- 标识符、提交信息、日志信息优先使用英文。
- 源码文件默认使用 ASCII；只有在本身就是国际化数据文件时才写入中文。

格式化基线来自 `.prettierrc.json`：

- `printWidth: 100`
- `tabWidth: 2`
- `semi: true`
- `singleQuote: true`
- `trailingComma: all`
- `endOfLine: lf`

## 6. 导入与依赖

- 优先复用现有 workspace 包和工具，而不是新增依赖。
- 如果一个辅助逻辑会被多个包复用，应上移到共享包，而不是复制粘贴。
- 避免 workspace 包之间形成循环依赖。
- 平台能力或现有工具能解决的问题，不要为此加新库。

## 7. 运行时配置、URL 与密钥

- 不得在运行时代码中硬编码凭据、令牌、API Host 或环境专属地址。
- 可变配置应来自环境变量、服务端配置或现有配置层。
- 属于公共标准的一次性常量允许硬编码，例如：
  `http://www.w3.org/2000/svg`、MIME type、XML namespace、schema URI。
- 各包 `package.json` 里的本地开发端口允许硬编码，因为它们属于仓库开发约定的一部分。
- 不得提交真实密钥；需要的变量以 `.env.example` 为准。

## 8. UI、UX 与 React 约定

- 编辑现有产品区域时，必须保持既有视觉语言。
- 除非任务明确要求，否则不要改变 Studio 现有交互语义、快捷键行为、面板布局预期或编辑流程。
- 优先确定性渲染，避免不必要的 effect 驱动实现。
- 热渲染路径中的重计算应尽量外提。
- 不要在生产路径新增 `console.*`，除非该文件已有明确且被接受的调试约定。
- 如果必须禁用 ESLint 规则，范围要尽可能小，并说明原因。

React 代码补充规则：

- 遵循当前模块现有 hook 模式。
- 不要默认滥加 memo 化原语，只有在性能证据或局部风格明确需要时才使用。
- 能从现有状态推导的值，不要再复制一份状态。

## 9. Widget 开发约定

本仓库推荐的 widget 开发路径基于 `vis-cli` 与 `@thingsvis/widget-sdk`。

推荐流程：

1. 使用 `pnpm vis-cli create <category> <name>` 生成标准脚手架
2. 在 `schema.ts` 中定义 props 结构与默认值
3. 在 `controls.ts` 中声明编辑器控件
4. 在 `metadata.ts` 中定义组件元信息、默认尺寸与约束
5. 在 `index.ts` 中使用 `defineWidget(...)` 实现唯一运行时入口
6. 使用 `pnpm vis-cli validate <widget-path-or-id>` 校验组件契约
7. 使用 `pnpm vis-cli verify <widget-path-or-id>` 做可交付性验证
8. 通过 `pnpm vis-cli dev <widget-path-or-id>` 或 `pnpm dev` 联调 Studio

标准脚手架结构通常是：

1. `schema.ts`：属性 schema 与默认值
2. `controls.ts`：编辑器控件
3. `metadata.ts`：组件元信息、默认尺寸、约束
4. `index.ts`：通过 `defineWidget` 实现运行时
5. `locales/*.json`：编辑器国际化文案

Widget 规则：

- 新组件默认通过 `vis-cli create` 创建，不要手写一套偏离模板的目录结构。
- `vis-cli` 生成的结构就是当前仓库认可的 canonical widget contract；除非仓库级约定变更，不要自创历史兼容入口。
- `index.ts` 必须以 `defineWidget(...)` 作为主入口，不要导出另一套平行运行时协议。
- `controls.ts` 应优先使用 `generateControls(...)` 或 `createControlPanel(...)`，不要绕开 SDK 自建一套不兼容的控件描述格式。
- `@thingsvis/widget-sdk` 是 widget 运行时契约层。优先复用它提供的能力，例如：
  `defineWidget`、`generateControls`、`createControlPanel`、颜色/locale/overlay 相关 helper。
- 如果 SDK 已经提供标准能力，不要在单个 widget 内重复实现同类基础设施。
- `metadata.ts` 是默认尺寸与约束的唯一来源，`index.ts` 不要重复写一套。
- 已发布 widget 的 `widget id`、包名、schema 字段名、control path、面向注册表的 metadata 默认视为持久化契约；重命名或删除前必须提供迁移方案或兼容层。
- `schema.ts`、`controls.ts`、运行时渲染必须一致，不能暴露“定义了但没生效”的死字段。
- 所有编辑器侧文案必须遵循第 10 节国际化规则。
- 只要某个控件支持动态数据，就必须在 `controls.ts` 显式启用 binding，并确保运行时能正确处理动态变化。
- 运行时数学计算要防御非法区间、除零、`NaN` 和缺失数据。
- SVG 组件优先使用简单形状和稳定 viewBox，避免过深层嵌套。
- SVG 注释如有保留，必须为英文；纯装饰性注释应删除。
- 若 widget 引入 overlay、主题色解析、locale 解析等能力，优先使用 SDK 暴露的类型与 helper，而不是在组件中重新定义一套局部协议。

## 10. 国际化

- 不得在源码里硬编码用户可见文案，不论是中文、英文还是其他语言。
- 国际化设计不得以 `zh` 和 `en` 两种语言为完成标准，也不得基于“是否存在中文或英文”来判断功能是否完成。
- i18n 必须按“可扩展多语言”设计，新增语言时不应要求改业务逻辑、控件协议或渲染分支。
- UI 文案必须进入 locale 文件或现有翻译层。
- translation key 应稳定、语义明确，并与具体语言解耦。
- 除非底层 API 明确要求，否则不要在同一控件模型里混用字面量语言对象和 i18n key。
- locale 文件与 `package.json > thingsvis.i18n` 属于声明层数据，允许承载语言文本；禁止的是在业务逻辑、控件协议和渲染代码里写死语言字面量。
- 禁止在源码中写死 `{ zh, en }` 这类仅服务双语特判的数据结构，除非是在兼容既有 API 且短期无法消除时；这类场景必须优先收敛到统一 locale key 模式。
- locale 文件可以包含任意目标语言文本；源码注释不可以。

## 11. 测试与验证

始终使用“足以证明改动正确”的最小命令。

推荐顺序：

1. 目标包 `typecheck`
2. 目标单测
3. 相关 app 或 workspace 测试
4. 只有在打包或发布行为受影响时才跑 build

常用命令：

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

Widget 场景示例：

- `pnpm --filter thingsvis-widget-industrial-valve typecheck`
- `pnpm --filter thingsvis-widget-industrial-pipe test`

验证要求：

- UI 改动：至少给出一条手工验证说明
- 几何或变换逻辑改动：行为变化时补测试或更新测试
- 绑定或数据流改动：同时验证静态路径和动态路径
- 契约改动：验证下游消费方

如果全仓已有与本次改动无关的失败测试，必须明确写出，不能假装全绿。

## 12. Review 拦截条件

出现以下任一情况，默认不能放行：

- 破坏现有公开契约且没有迁移方案
- 新增死配置或死字段
- 硬编码环境专属运行时值
- 用户可见文案没有进入 i18n
- 源码注释出现中文
- 没有解释却跳过最小必要验证
- 行为变了但没有验证说明

## 13. 文档与变更卫生

当以下内容发生变化时，应同步更新文档：

- widget 开发流程
- CLI 命令或生成目录结构
- Studio 用户可见流程
- embed 消息行为
- 后端初始化或环境变量

不要为尚未存在的 API 或流程编写投机性文档。

## 14. Commit 与 PR 约定

- 使用 Conventional Commits
- scope 要与改动区域匹配
- 一次 commit 只承载一个逻辑变更

示例：

- `feat(widget): add binding support for industrial controls`
- `fix(studio): normalize rotated anchor projection`
- `docs(conventions): add repo engineering rules`

## 15. Agent 执行说明

自动化 coding / review agent 在本仓库工作时应：

- 在做大改动前先读本文件
- 优先遵守仓库本地约定，而不是模型默认习惯
- 在结论中写明验证命令和验证范围
- 明确指出与当前任务无关的失败测试，不要静默忽略
- 未经 spec 批准，不要扩大修改文件范围
