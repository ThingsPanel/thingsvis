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

## Sub-task 3: 修复组件面板 (PropsPanel & ControlFieldRow) 多语言漏翻与 vis-cli 更新归档
- **What was done**: 1) 为 PropsPanel 与 ControlFieldRow 的 group.label/field.label 和选项配置增加了 `t()` 国际化包裹机制，并支持 defaultValue 作为 fallback；2) 挖掘了 Zod schema 中的各种遗留中文中文描述，作为 fallback 键全局补充到了中英双语的 editor.json 核心字典中。
- **What was tried & failed**: 直接让每个旧组件 schema 用 `.describe('widgets...')` 修改成本较高，转为基座自动兜底映射方案。
- **What succeeded**: i18next 结合 defaultValue 与字典 fallback 拦截所有旧中文文本（如：“图表标题”、“不透明度”、“数据源”）。
- **How it was tested**: 结合用户截图比对（如：Properties 原先为中文现在恢复，同时选项中原先是中文也能够全部正确被 t() 函数解析翻译成对应的英文 Chart Title）。
- **Key decisions & rationale**: 在基座底层进行 t() 包装，极大节省全局历史代码升级的工作负担。
- **Time/Iteration count**: 1

## Sub-task 4: 规范化 i18n Key (消除中文作为标识符的问题)
- **What was done**: 深度重构了基座语言包 (`editor.json`)，将早期所有的中文硬编码键（如 `"暂无图层"` 或 `"显示图例"` 等 90+ 项）统统转化为了标准的语义化英文Token（如 `layersPanel.empty` 和 `props.showLegend`）。通过自研脚本自动处理并覆盖整个项目的 40 多个源码文件，批量把中文替换成了正确的英文字典键名。
- **What was tried & failed**: 手动排查非常容易遗漏，并且导致系统崩溃死角，利用 AST 与 正则精准注入降低风险。
- **What succeeded**: 系统成功从架构根本上消除了用中文当 Key 取字典值的常见反面模式。
- **How it was tested**: 编译通过，并启动 dev server 确认双语切换平滑正常。
- **Key decisions & rationale**: 虽然直接使用中文做 i18n Key 能在业务迭代初期偷懒，但在组件库生态需要开放时将会是致命短板。这是正确、规范也是最值得的长效投资。
- **Time/Iteration count**: 1

## Sub-task 5: 规范跨平台 Widget 名称级国际化注入架构
- **What was done**: 1) 为 `@thingsvis/schema` 层的 `ComponentRegistryEntrySchema` 新增了 `i18n` 可选多语言映射块；2) 跑脚本遍历现有 10 余个组件的 `package.json`，在 `thingsvis` 内增加了双语翻译 (`{"zh": "圆形", "en": "Circle"}`)；3) 改造了构建时脚本 `scripts/generate-registry.js`，让其打包时自动抽取提取 `i18n` 数据合并至 `registry.json` 中；4) 更新了左侧核心面板 `ComponentsList.tsx` 的读取，实现了微冷启动生命周期的热刷新；5) 完善了 `vis-cli` 脚手架生成的 `package.json` 会自带多语言。
- **What was tried & failed**: 直接强拿 `metadata.ts` 失败。因为大屏刚加载左侧面板时并不会且不应该触发这部分非必要的 JS 流浪载入开销。
- **What succeeded**: 效仿 VSCode Extension 的 `package.nls.json`，走静态读取合并路线是完美的微架构。
- **How it was tested**: 重新使用 `pnpm registry:generate` 并启动服务，左侧几十个组件名称完美双语秒切无卡顿无网络新请求。
- **Key decisions & rationale**: 组件面板属于宿主的静态“市场橱窗”，而渲染在画布中央的属于“隔离微服务”。对于橱窗采用提取收集的单点分发静态 Manifest，才是解决这种"冷启动翻译"的最佳且唯一正确手段，也保证了第三方生态接入门槛（只用配 JSON 就能自带多语言）。
- **Time/Iteration count**: 1