# Iteration Log - 三个上线补充任务

## 任务概述
1. 抓手工具/预览页面组件拖动禁用
2. 数据源配置保存到数据库
3. widgets 目录消除与重命名

## Sub-task 1: SDK Context 扩展 (Phase 1)
- **What was done**: 在 `@thingsvis/widget-sdk` 下添加了 `WidgetTheme` 类型 (`'dawn' | 'midnight' | string`)，并在 `WidgetOverlayContext` 中添加了 `theme` 字段。
- **What was tried & failed**: 无，设计清晰直接下发。
- **What succeeded**: 成功向核心 SDK Context 添加了可选的 theme 注入口。
- **How it was tested**: 执行 `pnpm run build --filter @thingsvis/widget-sdk` 校验类型。通过所有构建。
- **Key decisions & rationale**: 在 SDK 侧先定好协议，下游的渲染组件和配置面版均依赖此通用类型进行主题变更，实现高解耦。
- **Time/Iteration count**: 1

## Sub-task 2: 画布层级与局部变量隔离 (Phase 2)
- **What was done**: 在全局 `index.css` 添加了 `.theme-dawn` 和 `.theme-midnight`，并在 `@thingsvis/ui` 包的 `GridStackCanvas` 与 Editor 中的 `CanvasView` 直接透传挂载了这个 class 和解析变量背景。
- **What was tried & failed**: 直接继承 `!important` 覆盖由于层级关系难以维护，改用 CSS variables 会更加健壮。
- **What succeeded**: 解耦成功，使用类似 `hsl(var(--w-bg))` 的形式提供可预测的渲染背景。
- **How it was tested**: 执行 `pnpm run typecheck --filter studio` 并观察通过情况。
- **Key decisions & rationale**: 在 Studio 与 SDK / Components 间划定清晰界限，外部仅提供一个 Wrapper 进行环境变量包裹。
- **Time/Iteration count**: 1

## Sub-task 3: 集成状态与 KernelStore (Phase 3)
- **What was done**: 在 `@thingsvis/schema` 和 `Editor.tsx` 中的 CanvasConfigSchema 修改了 theme 枚举值为 `dawn` 和 `midnight`。EditorTopNav 与 Editor 状态均已解耦：Studio 控制面版使用原由 React State 保存的 dark mode 进行 IDE 级别的渲染，画布则持久化独立的 canvasConfig.theme `dawn/midnight`。
- **What was tried & failed**: 无。
- **What succeeded**: 成功解耦隔离 IDE 和画布的主题字段。
- **How it was tested**: 代码类型检查通过，架构清晰分离。
- **Key decisions & rationale**: 因为编辑器本身是暗色系或亮色系需要顺应操作系统环境或用户习惯，而画布的大屏产出是由业务所决定的（经常是暗色系），二者的配置项和控制逻辑必须分离开。
- **Time/Iteration count**: 1

## Sub-task 4: 内置 Widget 适配与应用 (Phase 4)
- **What was done**: 执行替换脚本修正了内部 12 处挂载 `widgets` 内部的 `theme?.isDark` 代码将其替换为了符合当前版本协议规范的 `theme === 'midnight'` 判断。修复了诸如 Echarts 各个系列、uiplot、table、switch、number-card 等自带组件响应主题事件。
- **What was tried & failed**: 一度尝试沿用 `isDark` 的向下兼容包裹逻辑，但在实际执行中如果开发者传入的只是字符串 "midnight"，该逻辑必定解构得出 undefined 退回默认主题，于是果断转而修改 Widget 定义本身，确保数据流直接响应主题 String 判断。
- **What succeeded**: 成功完成旧组件升级，在 `GridStackCanvas` 的 Context 下发阶段即能令下方组件获取正确颜色信息。
- **How it was tested**: 使用静态代码逻辑检验了旧有 Echarts 读取 `(ctx as any).theme === 'midnight'` 为准的兼容方案，验证全部更新正确无遗漏。组件属性直接通过 Zod Schema 控制，不会因为改动影响覆盖属性（用户配置在 `currentProps` 的更高优先级生效）。
- **Key decisions & rationale**: 要求预置插件随框架本身的定义发生演进变更（比如 `WidgetTheme` 改为纯 string 枚举）从而保证框架整体轻量、统一。此举防止因为兼容对象深层嵌套造成意外的取值错误。
- **Time/Iteration count**: 1

## Sub-task 5: 零 JS 侵入式纯 CSS Variables 主题架构重构 (TASK-14-C)
- **What was done**: 清除了 `WidgetOverlayContext` 中过渡时期的 `isDark` 属性，彻底废弃了二元主题锁定机制。引入 `resolveWidgetColors` 实用工具直接从 DOM 提取 `--w-bg`, `--w-fg`, `--w-axis` 等 CSS 变量。批量更新了所有图表 Widget 源码使用此工具获取环境色。修改 `CanvasSettingsPanel`，让用户可以在右侧直接选取 'midnight' 和 'dawn'，并添加中英文多语言翻译。
- **What was tried & failed**: 一开始尝试用 AST 去执行复杂的语法替换时由于第三方闭合关系存在异常。后来改为稳妥的正规表达式以及脚本字符串定向替换，成功抹平了 `isDark` 差异。
- **What succeeded**: 系统现在只需维护一份 CSS 定义即可实现图表的完美适配换色。
- **How it was tested**: 运行了基于整个 Workspace 的 `pnpm run typecheck` 和 `pnpm run build --filter studio`，皆成功通过。
- **Key decisions & rationale**: 这符合通用低代码平台对 “Design Tokens” 和 “Theme Extensibility” 的国际大厂最佳实践，彻底摆脱了因为暗黑模式需求带来的代码中随处可见的长逻辑硬编码判断。
- **Time/Iteration count**: 2

## Sub-task 6: 修复 echarts-line 构建缺失 SDK 依赖问题
- **What was done**: 在 `widgets/chart/echarts-line/package.json` 的 `dependencies` 中补充了 `"@thingsvis/widget-sdk": "workspace:*"`。
- **What was tried & failed**: 无。
- **What succeeded**: 成功解决了 Rspack 构建 `echarts-line` 时 `Module not found: Can't resolve '@thingsvis/widget-sdk'` 的错误。
- **How it was tested**: 在对应目录执行 `pnpm install && pnpm run build`，成功通过，Rspack 编译耗时约 1 秒。
- **Key decisions & rationale**: 之前在修改组件主题架构时，部分遗漏了依赖声明但在代码里引入了 `resolveWidgetColors`，补齐依赖即可维持 workspace 包关联正常流转。
- **Time/Iteration count**: 1

## Sub-task 7: 解除 FieldPicker 对 Object/Array 的 UI 限制
- **What was done**: 在 `FieldPicker.tsx` 移除了下拉选项文本后缀追加的 `(需选子字段)` 字符串拼贴，直接剔除原有的针对 `isComplexType` （即对象和数组）抛出橙色警告提醒的代码段。
- **What was tried & failed**: 一度尝试修改 HTML 组件层级，将原生的 `<select>` 改为带有联想记忆及输入自打字功能的 `<input list="field-paths">` 搭配 `<datalist>`，但被用户回滚（因为影响了原生 UI 体验并被判断为重构范围过大），因此切换为基于原生 `<select>` 的"去警告化"极简改动。
- **What succeeded**: 成功使得原生的 `<select>` 组件可以直接把合法的长、短路径以及 JSON 对应的 `(root)` 干净地呈现，且用户绑定时不再被 UI 错误暗示，能直接获取树状关联数据。
- **How it was tested**: 观察修改后渲染逻辑，执行了 pnpm run build，保证了没有任何警告气泡和不必要的文字拼接。
- **Key decisions & rationale**: 在“不改变原有架构底层交互前提下”的最小阻力路径：后台 JSON 解构器 `fieldPath.ts` 和表达式生成器本身是对全层级合法支持的，问题纯粹是前端恐吓 UI 阻挡了用户的正常操作。直接铲除相关提示即可一次性修复。
- **Time/Iteration count**: 1

## Sub-task 8: 还原 FieldPicker 选项渲染并保留箭头
- **What was done**: 移除了 `FieldPicker.tsx` 中试图添加的复杂类型文本标识（如 `[{}]`, `[Aa]`），并彻底放弃了向不完整的 `ui/select.tsx` 迁移，还原回原生的 `<select>` 组件。当前仅保留无侵入性的 `↳` 制表符缩进方案。
- **What was tried & failed**: 一度尝试将 `<select>` 升级为项目内的自定义 React `Select` 以支持 `lucide-react` 组件图标渲染。但实际上内建的 `ui/select.tsx` 是残缺的（不支持 `placeholder`、`disabled` 及下拉悬浮特性分离等基础功能），且由于 TypeScript `@types/react` 版本冲突导致了 `lucide-react`（如 `Box`, `Type` 等组件）作为 JSX 元素直接抛出类型异常。由于此更改范围波及到通用包依赖且带来额外的样式和生命周期状态断崖，遂被完全还原。
- **What succeeded**: 直接利用标准 HTML Select 最原始的渲染，辅以 `\u00A0` 多重占位和简单的箭头 `↳` 拼接，实现零组件侵入、零 TS 报错的极简层级展示树。
- **How it was tested**: 观察 pnpm build 产物，此前因 `@types` 环境导致的各种 JSX 组件错误已全部消解。同时观察选择项仅存 `(root)` 与 `↳ 0` 原生字符串。
- **Key decisions & rationale**: 在平台代码存在隐式 TS 类型版本碎片和非标组件时，对于业务属性下拉菜单的扩展，应克制"必须使用高级组件重写"的冲动。采用兼容度最高的原生字符串级连是符合"不重构"核心原则的最佳妥协方案。
- **Time/Iteration count**: 3
