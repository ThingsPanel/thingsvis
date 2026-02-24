# TASK-06：缺失组件补齐

> **优先级**：🟡 P1 / 🟢 P2
> **预估工时**：3-5 人天（全部）
> **前置依赖**：TASK-05（命名重构完成后，按 Widget 规范开发）

---

## 背景

移除 indicator / pm25-card / water-tank 后，当前只有 **5 个 Widget**。需要补齐常用组件以满足基本可用性。

---

## P1 优先组件（v0.1.0 建议包含）

| 组件 | 工作量 | 说明 |
|------|--------|------|
| ECharts 柱状图 `echarts-bar` | 2-3h | 基于现有 echarts-line 复制改造 |
| ECharts 饼图 `echarts-pie` | 2-3h | 基于现有 echarts-line 复制改造 |
| MQTT 数据源 UI + Adapter | 1d | IoT 核心功能，连接 ThingsPanel |

### 任务清单
- [ ] **P1** 开发 ECharts 柱状图组件
- [ ] **P1** 开发 ECharts 饼图组件
- [ ] **P1** MQTT 数据源 Adapter 开发

---

## P2 后续组件（v0.2.0 规划）

| 组件 | 工作量 |
|------|--------|
| ECharts 仪表盘 `echarts-gauge` | 3-4h |
| 通用数值卡片 | 2-3h |
| 表格 Table | 4-6h |
| 开关 Switch / 按钮 / 滑块 | 5-8h |
| 视频流 / Iframe | 4-6h |
| uPlot 时序图 | 1-2d |

### 任务清单
- [ ] **P2** 各后续组件按需开发

---

## 验收标准

1. 新组件可在编辑器中正常拖拽和配置
2. `registry.json` 中正确注册
3. 组件属性面板可配置
4. 组件支持数据绑定（如 MQTT）
