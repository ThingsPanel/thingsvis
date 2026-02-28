# TASK-16：Widget 尺寸约束与元数据规范

> **优先级**：🟡 P1
> **预估工时**：0.5 人天
> **前置依赖**：TASK-14（SDK 升级后在元数据类型中扩展）

---

## 背景

Widget 可拖拽到任意尺寸，ECharts 组件小于 100×80 渲染异常。此外 Widget 的 peer 依赖（如 echarts 版本）未声明，Module Federation shared scope 无法对齐。

---

## 任务清单

### 尺寸约束
- [ ] `@thingsvis/widget-sdk/types.ts` — Widget 元数据新增 `constraints?: { minWidth, minHeight, maxWidth, maxHeight, aspectRatio }`
- [ ] 6 个现有 Widget + 新建 Widget 添加合理的 constraints 值
- [ ] `Studio TransformControls` — 拖拽/缩放时读取 constraints 并限制

### 依赖声明
- [ ] `@thingsvis/widget-sdk/types.ts` — Widget 元数据新增 `peerDependencies?: Record<string, string>`
- [ ] `echarts-line/bar/pie` 声明 `{ echarts: '>=5.4.0' }`
- [ ] Studio 加载 Widget 时校验 peerDependencies 版本兼容性，不兼容时 console.warn

---

## 验收标准

1. ECharts 组件无法被缩小到 minWidth/minHeight 以下
2. 拖拽时到达边界有视觉反馈
3. 加载 Widget 时如果宿主 echarts 版本不匹配，控制台输出警告
