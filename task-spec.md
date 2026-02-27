# Task Specification: 修复网格布局模式画布未居中与抓手工具无法拖拽问题

## 1. 任务边界 (Task Boundaries)
- **目标组件**: `packages/thingsvis-ui/src/components/GridStackCanvas.tsx`
- **涉及功能**: 
  - `GridStackCanvas` 在非全屏预览 (`!fullWidth`) 模式下的默认居中布局支持。
  - `GridStackCanvas` 内部对“抓手工具” (`activeTool === 'pan'`) 触发移动时的偏移量重新计算以及渲染绑定。
- **不涉及的功能**: 
  - Editor 顶层的工具栏状态扭转。
  - Fixed / Infinite 模式画布的逻辑（它们使用不同的底层）。
  - 组件内部具体的 Grid 矩阵计算逻辑（已由 gridstack 处理）。

## 2. 问题根因分析 (Root Cause Analysis)
经过对 `GridStackCanvas.tsx` 代码深层查阅，发现两个 CSS 拼写错误导致了浏览器解析失效：
1. **未居中 + 抓手无响应**: 
   在第 521 行的 `transform` 样式属性拼接时，存在不可见语法错误：
   `translate(calc(-50 % + ${panOffset.x}px), calc(-50 % + ${panOffset.y}px)) scale(${zoom})`
   注意 `-50 %` 中间不当的**空格**。CSS规范中 `50 %` 是非法的，必须连写为 `50%`。一旦非法，整个 `transform` 样式全部被浏览器忽略弃用，导致：
   - 没有了 `-50%`，无法绝对居中。
   - `panOffset` 跟着失效，鼠标再拖拽也没用。
   - `zoom` 缩放跟着失效（很可能也受影响缩放无响应）。
2. **Padding 解析报错**: 
   在第 535 行 `padding: \`${margin} px\`` 同样在数字和单位 `px` 间多了一个空格，使得 css 解析非法。

## 3. 验收标准 (Acceptance Criteria)
1. 编辑器进入网格模式时，中心画布应基于页面**绝对居中对齐**（自带阴影边框）。
2. 按键或顶栏选中**抓手工具 (Pan)** 时，在网格模式画布背景点按并拖动鼠标，画布容器必须顺滑跟随鼠标同步拖拽发生**位移平移**。
3. 对网格模式触发滚轮缩放时，缩放应针对当前画布中点且生效（恢复 `zoom` 渲染控制）。
4. 在修正 CSS string bugs 后无需增添或改下核心业务流状态，只修改表现层即算全部通过。
