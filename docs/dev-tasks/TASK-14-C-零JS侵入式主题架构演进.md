# TASK-14-C: 纯数据与样式驱动的主题解耦演进 (isDark 降级)

> **优先级**：🔴 P0 
> **预估工时**：1 人天
> **前置依赖**：TASK-14-B (已完成的基础上下文和类型扩展)

---

## 1. 背景与目标

虽然已经在 TASK-14-B 中完成了画布和编辑器的环境隔离，但发现当前对暗色系的依赖通过提取 `isDark` 标识强耦合在所有组件逻辑内部，强迫图表表现陷入“非黑即白”的二元僵局。这与国际顶级大屏引擎（如 Grafana, ThingsBoard）的纯 Design Tokens 驱动相悖，不利于无限扩展用户自定义的主题配置体系，并产生了侵入式的条件分支。

目标：实现真正的 **“零 JS 侵入式主题扩展”**，即组件基于 CSS Variables 消费（在必要如图表中时），移除所涉及 Widget 中对 `isDark` 判断的所有逻辑代码，使得未来新增任意色表主题只需维护一组全局 CSS。

## 2. 核心架构设计

- **规范化设计令牌 (Design Tokens)**：抽象提取通用的图表颜色基准变量。
  - `--w-bg`: 画布/主背景色
  - `--w-fg`: 前景文字 (标题等)
  - `--w-axis`: 图表辅助线/坐标轴的弱化配色
  - `--w-primary`: 强调色
- **多态消费层提取封装**：图表类引擎不能继承 CSS 变量，但在 `@thingsvis/widget-sdk` 中封装通用的 `resolveWidgetConfig` 等提取器工具函数，挂载阶段直接获取实际渲染色用于 ECharts 引擎。
- **清除 `isDark`**：不再从层层传递中维持二元判断 `isDark` 变量。

## 3. 任务执行拆解

- [ ] **Phase 1: SDK 适配提取器**
  - [ ] 撤销 TASK-14-B 中在 `packages/thingsvis-schema/src/widget-module.ts` 以及 `packages/thingsvis-widget-sdk/src/types.ts` 等加入的 `isDark` 补丁。
  - [ ] 在 `packages/thingsvis-widget-sdk` 下添加 `utils/themeContext.ts` 导出 `resolveWidgetColors(el: HTMLElement)` 根据元素的 CSS Variables 获取颜色方案（带内部 Fallback 策略预防计算缺失）。

- [ ] **Phase 2: 全局 CSS Variables 布设**
  - [ ] 完善 `apps/studio/src/index.css` 或是预设的 `.theme-dawn` / `.theme-midnight`。注入完整的图表系令牌 `--w-fg` 和弱化色 `--w-axis` 等等。

- [ ] **Phase 3: 图表组件的 isDark 毒瘤清理**
  - [ ] 编写或调整脚本，遍历所有的 widgets。
  - [ ] 将所有的 `isDark ? 'A' : 'B'` 形式替换为来自 `resolveThemeColors(element)` 的返回值。
  - [ ] 从 Widget 和 Overlay Context 移除 `isDark` 下发。

- [ ] **Phase 4: 测试与验证**
  - [ ] 独立切换一个完全不同的 `theme-custom` 然后验证 ECharts 和 Text 是否可以正常消费定制好的 `--w-axis` 等 CSS 变量。
