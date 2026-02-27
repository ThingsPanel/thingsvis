# Implementation Plan: 修复 GridStackCanvas 布局渲染及拖拽偏移

## 1. 具体改动内容 (Changes to apply)

### 编辑目标
**`packages/thingsvis-ui/src/components/GridStackCanvas.tsx`**

**修改点 1（第 521 行）：修正中心布局、平移属性及缩放解析失败**
> 原本：
> `transform: translate(calc(-50 % + ${panOffset.x}px), calc(-50 % + ${panOffset.y}px)) scale(${zoom}),`
> 修改为：
> `transform: translate(calc(-50% + ${panOffset.x}px), calc(-50% + ${panOffset.y}px)) scale(${zoom}),`
* 说明：删除掉所有的 `-50 ` 和 `%` 之间的多余空格。

**修改点 2（第 535 行）：修复 Padding 单位错误**
> 原本：
> `padding: ${margin} px,` 
> 修改为：
> `padding: ${margin}px,`
* 说明：删除掉数值和 px 单位之间的多余空格，保证它是一个完整的如 "5px" 格式而非 "5 px"。

## 2. 验证方式 (Verification Strategy)
本次改动在前端视图发生直接视觉反馈：
- **手动测试**（在 Rsbuild 浏览器页面）：
   1. 在 Editor 里通过右面板“布局模式”切换为“网格”(Grid)。
   2. 预期不点任何对象时，网格能够稳稳停留在 Editor 中间的 50% / 50% 轴线上，且其边框存在白色（`dawn` 主题）及轻微盒子阴影。
   3. 在顶部点击工具栏的第三项“抓手”(Pan, `hand` icon)，使得鼠标变成 grab 图标。
   4. 对着空白网格区域拖拽，期望整个白板由于 `panOffset.x / panOffset.y` 修改且被有效渲染到 `translate` 函数，画布产生平移跟手动画。
   5. 检查 padding 的错误消失。

通过以上极微小且无隐患的改动即可修复所有的布局不居中及拖动无效（实际上 React 层由于 mouseEvent 已经计算出来了 panOffset 变量并且触发了 rerender，但由于 CSS parse 错误直接丢弃了整条 declaration。这是十分经典的 CSS 静默解析特性）。
