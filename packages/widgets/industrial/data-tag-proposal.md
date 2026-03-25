# Data Tag 组件实现方案

## 视觉分析
```
┌─────────────────────────────────────┐
│  供水温度      43.9        °C       │
│  (灰色标签)   (红色数值)   (灰色单位) │
└─────────────────────────────────────┘
```

## Props 设计
```typescript
{
  label: string;           // 标签文本，如 "供水温度"
  value: number | string;  // 数值，支持数据绑定
  unit: string;            // 单位，如 "°C"
  
  // 样式配置
  labelColor: string;      // 标签颜色 (默认: 继承主题灰色)
  valueColor: string;      // 数值颜色 (默认: 红色高亮)
  unitColor: string;       // 单位颜色 (默认: 继承主题灰色)
  
  // 布局
  layout: 'row' | 'compact'; // row: 横向排列, compact: 紧凑模式
  fontSize: number;        // 基础字号
  valueSize: number;       // 数值字号 (通常比基础大)
  
  // 背景
  backgroundColor: string; // 背景色
  borderColor: string;     // 边框色
  borderRadius: number;    // 圆角
  padding: number;         // 内边距
  
  // 数据绑定
  binding: boolean;        // 是否支持数据绑定
}
```

## 实现要点
1. 使用 Flex 布局：label | value | unit
2. value 使用 `font-weight: bold` 加粗
3. 默认 valueColor 为红色 `#ff4d4f` 或 `#ff7875`
4. 支持数据驱动更新

## DataV 参考
dv-capsule-chart 中的 label-column 实现类似效果
