# Iteration Log

## 历史任务摘要（来自 docs/dev-tasks/iteration-log.md）
> 之前完成了 6 个子任务，涵盖：SDK Context 扩展、画布主题隔离、KernelStore 集成、Widget 适配、CSS Variables 主题重构、echarts-line 构建修复。详见 `docs/dev-tasks/iteration-log.md`。

---

## Sub-task 7: 修复仪表盘/饼图等组件无法拖拽问题

### 7.1 分析与解决
- **What was done**: 
  1. 修复了致命的构建错误：部分组件编译出单独的一个 `dist` 文件而不是目录。修复了在 `package.json` 的 `deploy:widgets` 脚本中对于 "文件已存在" 的判断丢失，现会 `unlinkSync` 然后再建立正确的 `dist` 目录。执行了 `pnpm build:widgets`。
  2. 修复了 `echarts-gauge`、`echarts-pie` 组件代码中针对遗留 `isDark` 变量引发的报错（`ReferenceError: isDark is not defined`）。将判断转为新版从 `colors` 对象中直接提取相应颜色。
  3. 修复并从根源上消除了 **ECharts Canvas 拦截与吞噬拖拽事件的问题**：在 `Moveable` 拖拽过程中，系统为了视觉层叠将当前组件 `overlayBox` 设置 `z-index: 1000`。由于底层部件原始带有 `pointer-events: auto`，直接越俎代庖吞吐了由于 z-index 提升带来的拖拽 Move 动作。于是在 `@thingsvis/ui` 的 `widgetRenderer.ts` 中写入拦截判定：如果系统处于 Editor `editable` 状态下，将 DOM 底层的事件侦听剥夺 `pointerEvents = 'none'`，完全放权给更高层抽象负责。
- **What was tried & failed**: 测试阶段直接通过 PowerShell 检查文件 IO 差异确定出组件实际上加载失败退化为 placeholder 时的底层关联反应。
- **What succeeded**: 组件产物均被重建，Moveable 层重新在编辑环境获得绝对控制权。
- **How it was tested**: 代码逻辑盘点及脚本本地成功重编测试。
- **Key decisions & rationale**: 直接要求底层的 `VisualEngine` + `WidgetOverlayRenderer` 对于编辑状态不保留 `auto` 的接收权。防止类似于 ECharts 的底层类库因为本身包含丰富交互逻辑截断了外部 React 事件的冒泡与调度。这是在编辑器层设计中保持单一职责极其重要的一步。
- **Time/Iteration count**: 1

---

## Sub-task 8: 修复上传图片不显示问题

### 8.1 分析与解决
- **已完成工作**:
  修复了图片上传成功后画布上不显示的问题。根因是 rsbuild dev server (`localhost:3000`) 缺少对 `/uploads` 路径的代理配置，导致上传后返回的 URL（如 `http://localhost:3000/uploads/xxx.jpg`）在前端请求时无法找到文件。文件实际存储在后端 Next.js 服务的 `apps/server/public/uploads/` 目录下，由 `localhost:8000` 提供服务。
- **尝试与失败记录**: 无失败，一次定位到根因。
- **最终成功方案**:
  在 `apps/studio/rsbuild.config.ts` 的 `server.proxy` 中增加 `/uploads` → `http://localhost:8000` 的代理规则，与已有的 `/api` 代理规则保持一致。
- **测试方法与结果**: 需要重启 dev server 后验证，在浏览器中访问 `http://localhost:3000/uploads/tbJF7d_do9yFIvqDdsedl.jpg` 应能正常加载图片。
- **关键决策与原因**: 选择在 rsbuild proxy 层面解决，而非修改前端 URL 拼接逻辑。因为 proxy 是开发环境的标准做法，生产环境通常由 Nginx/反向代理统一处理，不需要改前端代码。
- **耗时/迭代次数**: 1

---

## Sub-task 9: isDark 残留全面清理 — 画布/组件暗色污染根治

### 9.1 分析与解决
- **已完成工作**:
  全面清理了 TASK-14-C 中遗留的所有 `isDark` 硬编码。共涉及 10 个文件：
  1. **SDK 类型层** (2 文件): 从 `thingsvis-widget-sdk/types.ts` 和 `thingsvis-schema/widget-module.ts` 的 `WidgetOverlayContext` 中移除 `isDark?: boolean` 字段。
  2. **画布渲染器** (1 文件): `GridStackCanvas.tsx` 中的 `nodeToOverlayContext()` 不再下发 `isDark: theme === 'midnight'`。
  3. **Widget 组件** (7 文件): 清除全部 8 个 widget 中的 `let isDark = true` 硬编码和基于 isDark 的颜色覆盖逻辑：
     - `basic/table` — 移除默认颜色替换逻辑
     - `basic/switch` — 移除 inactiveColor 替换逻辑
     - `indicator/number-card` — 移除 backgroundColor/titleColor 替换逻辑
     - `chart/echarts-line` — 移除变量声明和赋值
     - `chart/echarts-pie` — 移除变量声明和赋值
     - `chart/echarts-gauge` — 移除变量声明和赋值
     - `chart/echarts-bar` — 移除变量声明和赋值
     - `chart/uplot-line` — 移除变量声明和赋值，改用 resolveWidgetColors() 提取的 colors.fg/colors.axis
- **尝试与失败记录**: multi_replace_file_content 工具对 switch 和 echarts-bar 文件产生了格式损坏，使用 write_to_file 完整覆盖后修复。
- **最终成功方案**: 所有 Widget 改为通过 `resolveWidgetColors(element)` 从 DOM 的 CSS 变量（`--w-fg`, `--w-bg`, `--w-axis` 等）中获取颜色，不再使用二元的 isDark 标识。
- **测试方法与结果**: `pnpm build:widgets` 全部 15 个组件编译成功，零错误。
- **关键决策与原因**:
  1. **保留 Editor.tsx 的 isDarkMode** — 这是编辑器 UI（工具栏、面板）的暗色模式，与画布主题独立。画布通过 `className={theme-${theme}}` 建立了独立的 CSS 变量作用域。
  2. **不修改 widgetRenderer.ts** — 虽然 `nodeToOverlayContext()` 没传 theme 字段，但没有 widget 依赖 `ctx.theme`；所有 widget 通过 `getComputedStyle()` 从 DOM 树读取 CSS 变量，不需要 JS 层面传递 theme。
  3. **widgetRenderer.ts 与 VisualEngine 的 theme 感知问题** — 固定/无限画布的渲染路径中，theme 通过 Studio CanvasView 的 `className={theme-${theme}}` 在 DOM 上生效，overlay element 作为其子元素自动继承 CSS 变量，因此无需额外传递。
- **耗时/迭代次数**: 1

---

## Sub-task 10: 编辑器暗色模式与画布主题的彻底解耦

### 10.1 分析与解决
- **已完成工作**:
  彻底解耦了编辑器 dark/light 模式与画布主题，修复了 3 层耦合：
  1. **CSS 变量隔离完善** (`index.css`): `.theme-dawn` 和 `.theme-midnight` 补全了所有 Tailwind CSS 变量覆盖（`--accent`, `--secondary`, `--destructive`, `--input`, `--ring`, `--primary`, `--primary-foreground`, `--chart-*`, `--radius`），形成完整隔离屏障。
  2. **默认 theme 值修正** (`Editor.tsx`): 画布默认 theme 从 `"dark"` 改为 `"midnight"`（`"dark"` 对应的 `theme-dark` CSS class 没有定义）。
  3. **Theme 值运行时规范化** (`CanvasView.tsx`, `GridStackCanvas.tsx`): 非 `dawn` 的值一律兜底到 `midnight`。
- **尝试与失败记录**: 最初错误移除了 `document.documentElement.classList.toggle("dark")`，导致 Tailwind `dark:` 工具类和 Portal 弹出层暗色样式失效。回退后改为纯 CSS 变量覆盖方案。
- **最终成功方案**: 保留 `<html>` 上的 dark class（编辑器 UI 需要），通过 `.theme-*` 完整 CSS 变量覆盖隔离画布。
- **测试方法与结果**: 浏览器自动化测试验证 4 种组合（编辑器亮/暗 × 画布 Dawn/Midnight），画布颜色均不受编辑器主题影响。
- **关键决策与原因**: 不移除全局 dark class — Tailwind `dark:` 前缀和 Portal 弹出层依赖它。
- **耗时/迭代次数**: 2

---

## Sub-task 11: 画布多主题架构中心化与注册表机制重构

### 11.1 分析与解决
- **已完成工作**:
  废除了所有散落在组件中的脏代码（例如 `theme === 'midnight' || theme === 'dark' ? 'midnight' : 'dawn'` 的条件判断），实现了数据驱动的中心化多主题架构。
  1. **新建核心注册表**: 在 `@thingsvis/schema` 增加了 `theme-registry.ts` 并通过 `index.ts` 对外导出。该文件内定义了只读常量 `CANVAS_THEMES` 对象，并且实现了专门的验证兜底函数 `validateCanvasTheme(themeValue)`。
  2. **消除视图判断逻辑**: 分别清除了 `packages/thingsvis-ui/src/components/GridStackCanvas.tsx` 和 `apps/studio/src/components/CanvasView.tsx` 中写死的旧版映射与判断。现在视图层是纯净的应用层，直接使用 `validateCanvasTheme()` 的返回值作为 DOM class。
  3. **下沉默认类型配置**: 在编辑器 `apps/studio/src/components/Editor.tsx`，使用 `DEFAULT_CANVAS_THEME` 常量替代了所有原先手写的字面量默认值（例如 `'dawn'` 和 `'midnight'`），彻底消除了 Typescript 的 Type Literal 硬编码。
  4. **动态化面板渲染**: 修改了右侧面板 `CanvasSettingsPanel.tsx`。以前的下来选择菜单是硬编码 `<option>` 标签。现在直接遍历 `Object.values(CANVAS_THEMES)` 进行动态映射与呈现，使得以后每当你增加一个主题时，选项面板便实现“自动落位”。
- **最终成功方案**: 建立严格的 Theme Registry 并封装 `validateCanvasTheme()`。在所有入口点进行校验。
- **关键决策与原因**: 架构向着可插拔式、高扩展方向演进。避免 `if-else` 会随着未来比如深绿 (`forest`) 等主题的引入成倍产生债务。
- **耗时/迭代次数**: 1

---

## Sub-task 12: 修复网格画布模式未居中及抓手工具无法拖拽问题

### 12.1 分析与解决
- **已完成工作**:
  修复了在网格（Grid）画布模式下，中心舞台未能居中以及按下顶部“抓手工具”拖拽时由于 CSS 样式解析错误导致的平移失效问题。
- **尝试与失败记录**: 无（代码走查即刻精准定位）。
- **最终成功方案**: 
  在 `packages/thingsvis-ui/src/components/GridStackCanvas.tsx` 中：
  1. 修复了 `transform` 内错误的空格格式：将 `translate(calc(-50 % + ...` 替换为正确的 `translate(calc(-50% + ...`。这恢复了绝对定位下的 `-50%` 主轴居中基准，并使得 `panOffset` 变量的变化能正确体现到平移渲染。
  2. 修复了 `padding: \`${margin} px\`` 为 `padding: \`${margin}px\``。
- **测试方法与结果**: 开启 Grid 模式后，中心视口成功恢复白底白边并居中；点状操作条通过 Pan 工具能在白板空白处正常顺滑起效。
- **关键决策与原因**: JSX 内联的 CSS 语法解析是静默的，一旦发生非法内容该属性被整条放弃，这解释了为何数据层有变更但视图瘫痪。对 CSS Literal 格式去空格进行极简纠正则可修复。
- **耗时/迭代次数**: 1

---

## Sub-task 13: 修复图层面板多语言（i18n）不显示的问题

### 13.1 分析与解决
- **已完成工作**: 修复了 `LayerPanel` 的右键上下文菜单等相关文案显示 `layersPanel.bringToFront` 及 `common.delete` 而非翻译文本的 Bug。
- **尝试与失败记录**: 无（查阅代码结构得知缺省了命名空间）。
- **最终成功方案**: 将 `const { t } = useTranslation()` 更改为 `const { t } = useTranslation('editor')`，使其从 `editor.json` 内读取正确的文本及语言对象资源树。
- **测试方法与结果**: 刷新 `http://localhost:3000/main#/editor` 并在图层面板观察上下文菜单，已成功渲染文本 "置于顶层"、"删除" 等。
- **关键决策与原因**: 由于根 i18n 配置项 `defaultNS` 是 `common`，所以在缺少指定命名空间下将找不到嵌套到该面板的内容映射，属于用法层级矫正。
- **耗时/迭代次数**: 1

---

## Sub-task 14: 修复图层重新排序后未能成功保存的 Bug

### 14.1 分析与解决
- **已完成工作**: 修复了在左侧拖拽移动某些组件后的显示位置（包括成组图层等）并按下保存时未能向序列化保存新文件结构的 Bug。
- **尝试与失败记录**: 无（梳理内核设计思路确认 `layerOrder` 并没有在最终导出的结构树中进行干预）。
- **最终成功方案**: 修改了 `Editor.tsx` 在序列化函数 `getProjectState` 中提取 `nodes` 序列的返回规则，由原本基于字典散列的 `Object.values(state.nodesById)`，修正为严格按 `state.layerOrder` 逐一映射取值的方式提取结构定义：`state.layerOrder.map(id => state.nodesById[id]?.schemaRef).filter(...)`，以完整映射及覆盖用户最终保存时预设层叠序的主体意图。
- **测试方法与结果**: TypeScript 编译正常，无副作用破坏，保存过程从逻辑面上顺滑连贯重放用户的拖拽视图排序指令。
- **关键决策与原因**: 解决视图层（`layerOrder`）与持久层序列化逻辑不一致导致的经典场景，让数据保存出口与 UI 显示源保持强同源才是正统解决。
- **耗时/迭代次数**: 1

---

## Sub-task 15: 移除连线组件的黄色 Debug 提示窗

### 15.1 分析与解决
- **已完成工作**: 从 `apps/studio/src/components/tools/LineConnectionTool.tsx` 文件中清除了在左上角由于调试引入的硬编码黄色 DOM 节点 (`Line selected: ...`)。
- **尝试与失败记录**: 无（根据应用截屏快速定位）。
- **最终成功方案**: 删除 `position: fixed` 的黄色容器标记代码即可。
- **测试方法与结果**: 连线组件可以正常使用，不再受到与业务无关的调试输出干扰，代码也变得更加整洁。
- **关键决策与原因**: 处于项目稳定阶段，不再需要此类调试浮窗。
- **耗时/迭代次数**: 1
