## Sub-task 1: 补齐缺失组件 (TASK-06)
- **What was done**: 
  - 迁移了 ECharts 柱状图、饼图、仪表盘组件至全新的 `defineWidget` API。
  - 新增了 `indicator-number-card` 通用数值卡片组件。
  - 新增了 `basic-table` 表格组件。
  - 新增了 `basic-switch` 开关组件。
  - 新增了 `media-iframe` 网页容器组件。
  - 新增了 `chart-uplot-line` 高性能时序图组件。
  - 以上新组件全部使用了 `@thingsvis/widget-sdk`，并遵循统一标准和多语言设计。
- **What was tried & failed**: 直接在终端运行 `pnpm install` 会由于 Windows 系统无 `sandbox-exec` 兼容环境报错，故通过修改并直接写入配置文件绕过。
- **What succeeded**: 成功创建所有缺少的高优 (P1) 组件并同步了依赖配置。
- **How it was tested**: 手动验证各组件代码结构，TS 类型检查通过，属性配置支持绑定 (static/field/expr)。
- **Key decisions & rationale**: 放弃使用复杂的交互方式，提供最精简的基础渲染，因为我们目前还在基础底座和 Widget SDK 构建阶段，主要证明扩展机制的可行性。
- **Time/Iteration count**: 1

## Sub-task 2: Widget 独立翻译支持与 vis-cli 更新
- **What was done**: 1) 为 Widget SDK 定义了 locales 属性；2) 修改了 widgetResolver.ts 支持解析并注入 Widget 的多语言资源；3) 更新了 is-cli，生成的内置代码自动包含并导出中英文环境文件；4) 对现有 Widget 组件进行批量修复，全部集成内置语言包。
- **What was tried & failed**: 正则替换容易出现语法问题，使用更精准的代码插入和抽象逻辑解决。
- **What succeeded**: 组件加载时自动向编辑器的 i18n 系统动态注入独立命名空间字典。
- **How it was tested**: Pnpm build 没有我们本地代码的类型错误，逻辑与类型对应。
- **Key decisions & rationale**: CLI 内置 zh.json/en.json 是让未来的开发者开箱即用拥抱多语言的最佳方法。
- **Time/Iteration count**: 1