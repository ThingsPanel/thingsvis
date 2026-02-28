# TASK-06：缺失组件补齐

> **优先级**：🟡 P1 / 🟢 P2
> **预估工时**：3-5 人天（全部）
> **前置依赖**：TASK-14（SDK 核心升级）、TASK-15（Widget 迁移到 SDK）

---

## 背景

当前只有 **6 个 Widget**（text/rectangle/circle/line/image/echarts-line）。需要补齐常用组件以满足基本可用性。

> **重要**：所有新组件必须使用 `@thingsvis/widget-sdk` 的 `defineWidget()` API 开发，自带 `locales` 多语言翻译，支持 `ctx.theme` 主题适配。

---

## 新组件开发规范

```typescript
// 必须遵循的模式
import { defineWidget } from '@thingsvis/widget-sdk';
import { z } from 'zod';

export default defineWidget({
  id: 'chart-echarts-bar',
  name: 'widget.echarts-bar.name',  // i18n key
  category: 'chart',
  icon: 'BarChart3',
  version: '1.0.0',
  
  schema: z.object({ /* Zod 定义 */ }),
  controls: { /* 分组配置 */ },
  
  // 可选：自定义控件
  // controlRenderers: { 'custom:xxx': { component: MyControl } },
  
  // 可选：数据预处理
  // transformData: (rawData, props) => processedData,
  
  // 主题适配
  render: (el, props) => {
    // 使用 ctx.theme 适配颜色
  },
  
  // 多语言
  locales: {
    zh: { /* ... */ },
    en: { /* ... */ },
  },
});
```

---

## P1 优先组件（v0.1.0 建议包含）

| 组件 | 工作量 | 说明 |
|------|--------|------|
| ECharts 柱状图 `echarts-bar` | 2-3h | 基于 SDK defineWidget + echarts-line 参考 |
| ECharts 饼图 `echarts-pie` | 2-3h | 同上 |
| ECharts 仪表盘 `echarts-gauge` | 3-4h | |
| 通用数值卡片 | 2-3h | |
| 表格 Table | 4-6h | |
| 开关 Switch / 按钮 / 滑块 | 5-8h | |
| 视频流 / Iframe | 4-6h | |
| uPlot 时序图 | 1-2d | |

### 任务清单
- [x] **P1** 开发 ECharts 柱状图组件（使用 SDK defineWidget）
- [x] **P1** 开发 ECharts 饼图组件（使用 SDK defineWidget）
- [x] **P1** 开发 ECharts 仪表盘 `echarts-gauge`
- [x] **P1** 开发 通用数值卡片
- [x] **P1** 开发 表格 Table
- [x] **P1** 开发 开关 Switch / 按钮 / 滑块
- [x] **P1** 开发 视频流 / Iframe
- [x] **P1** 开发 uPlot 时序图

---

## 验收标准

1. 新组件使用 `defineWidget()` API，不复制 `lib/types.ts`
2. 新组件包含 `locales`（至少 zh + en）
3. 新组件适配 `ctx.theme`（至少背景色和图表色板）
4. 新组件在编辑器中可正常拖拽、配置、渲染
5. `registry.json` 中正确注册
6. 组件属性面板可配置
