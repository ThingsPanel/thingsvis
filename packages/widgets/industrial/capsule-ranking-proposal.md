# Capsule Ranking 组件实现方案

## 视觉分析（截图左中侧"耗能排名"）
```
耗能排名
┌────────────────────────────────────────┐
│ 1 │ 耗水 ▲         ████████████  1.3 m³ │
│ 2 │ 耗电 ▲         ████████      4.3 KW │
│ 3 │ 耗气 ▲         ██████          3.1  │
│   │                ...                 │
└────────────────────────────────────────┘
     ↑标签            ↑胶囊条      ↑数值
```

## Props 设计
```typescript
{
  // 数据
  data: Array<{
    name: string;      // 名称
    value: number;     // 数值
    unit?: string;     // 单位
    icon?: string;     // 图标
  }>;
  
  // 排序
  sortBy: 'value' | 'name' | 'none';
  sortOrder: 'asc' | 'desc';
  maxValue: number;      // 最大值，用于计算比例 (默认自动计算)
  
  // 胶囊样式
  capsuleHeight: number; // 胶囊高度
  capsuleRadius: number; // 圆角半径
  capsuleColors: string[]; // 渐变色数组
  
  // 标签
  showRank: boolean;     // 显示排名
  showIcon: boolean;     // 显示图标
  showValue: boolean;    // 显示数值
  showUnit: boolean;     // 显示单位
  
  // 布局
  rowHeight: number;     // 行高
  gap: number;           // 行间距
  labelWidth: number;    // 标签区域宽度
  
  // 特殊排名样式
  top3Colors: [string, string, string]; // 前三名颜色
}
```

## 实现方案

### 方案 A：纯 DOM 实现（推荐）
结构清晰，易于定制动画。

```html
<div class="capsule-ranking">
  <div class="ranking-header">耗能排名</div>
  
  <div class="ranking-list">
    <div class="ranking-item" v-for="(item, index) in sortedData" :key="item.name">
      <!-- 排名序号 -->
      <div class="rank-number" :class="`rank-${index + 1}`">
        {{ index + 1 }}
      </div>
      
      <!-- 标签 -->
      <div class="rank-label">{{ item.name }}</div>
      
      <!-- 胶囊条 -->
      <div class="capsule-track">
        <div 
          class="capsule-fill" 
          :style="{ width: `${(item.value / max) * 100}%` }"
        ></div>
      </div>
      
      <!-- 数值 -->
      <div class="rank-value">{{ item.value }} {{ item.unit }}</div>
    </div>
  </div>
</div>
```

```css
.ranking-item {
  display: flex;
  align-items: center;
  height: 32px;
  gap: 8px;
}

.rank-number {
  width: 20px;
  text-align: center;
  font-weight: bold;
}

.rank-1 { color: #ff4d4f; }  /* 第一名红色 */
.rank-2 { color: #faad14; }  /* 第二名橙色 */
.rank-3 { color: #52c41a; }  /* 第三名绿色 */

.capsule-track {
  flex: 1;
  height: 12px;
  background: rgba(255,255,255,0.1);
  border-radius: 6px;
  overflow: hidden;
}

.capsule-fill {
  height: 100%;
  background: linear-gradient(90deg, #0ea5e9, #06b6d4);
  border-radius: 6px;
  transition: width 0.5s ease;
}
```

### 方案 B：基于 ECharts 定制
参考 `chart/echarts-bar` 组件，将 bar 设为圆角。

```javascript
// ECharts 配置
{
  series: [{
    type: 'bar',
    barWidth: 12,
    itemStyle: {
      borderRadius: 6,
      color: new echarts.graphic.LinearGradient(...)
    },
    label: {
      show: true,
      position: 'right'
    }
  }]
}
```

**推荐方案 A**，因为：
1. 更轻量（无需 ECharts）
2. 更易定制排名序号样式
3. 动画控制更灵活

## DataV dv-capsule-chart 参考

DataV 的胶囊图源码结构：
```vue
<template>
  <div class="dv-capsule-chart">
    <div class="label-column">
      <div v-for="item in data" :key="item.name">{{ item.name }}</div>
    </div>
    <div class="capsule-column">
      <div v-for="item in data" :key="item.name" class="capsule-item">
        <div class="capsule-body">
          <div class="capsule-fill" :style="{ width: item.percent + '%' }"></div>
        </div>
        <div class="capsule-value">{{ item.value }}</div>
      </div>
    </div>
  </div>
</template>
```

DataV 特点：
- 左右两栏布局
- 胶囊内部支持多色段
- 单位显示在右上角

## 排序算法
```typescript
const sortedData = computed(() => {
  if (props.sortBy === 'none') return props.data;
  
  return [...props.data].sort((a, b) => {
    const factor = props.sortOrder === 'desc' ? -1 : 1;
    return (a.value - b.value) * factor;
  });
});

const max = computed(() => {
  return props.maxValue || Math.max(...props.data.map(d => d.value));
});
```

## 动画效果
```css
.capsule-fill {
  animation: fillIn 0.6s ease-out;
}

@keyframes fillIn {
  from { width: 0; }
}

.ranking-item {
  animation: slideIn 0.4s ease-out;
  animation-delay: calc(var(--index) * 0.1s);
}
```
