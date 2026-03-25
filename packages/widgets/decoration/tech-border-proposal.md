# Tech Border 组件实现方案

## 视觉分析
截图中的边框特征：
1. 四角斜切（八边形效果）
2. 外发光效果
3. 内部可以放置其他组件

```
      ╱────────────────────────╲
     ╱                          ╲
    │    ┌──────────────────┐    │
    │    │                  │    │
    │    │    内容区域       │    │
    │    │                  │    │
    │    └──────────────────┘    │
     ╲                          ╱
      ╲────────────────────────╱
```

## Props 设计
```typescript
{
  // 基础配置
  variant: 'corner-cut' | 'tech-lines' | 'glow'; // 边框变体
  
  // 颜色
  primaryColor: string;    // 主色 (发光色)
  secondaryColor: string;  // 副色
  backgroundColor: string; // 背景色
  
  // 发光效果
  glowEnabled: boolean;
  glowBlur: number;        // 模糊半径
  glowSpread: number;      // 扩散范围
  
  // 装饰
  cornerSize: number;      // 斜角大小
  lineWidth: number;       // 线宽
  showDecoration: boolean; // 是否显示四角装饰
  
  // 动画
  animated: boolean;       // 是否启用流动动画
  animationSpeed: number;  // 动画速度
}
```

## 实现方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|-----|------|------|-------|
| SVG | 效果丰富，可动画 | 需要计算布局 | ⭐⭐⭐ |
| CSS clip-path | 性能好 | 发光效果受限 | ⭐⭐ |
| border-image | 最简单 | 无法动态变色 | ⭐ |

## 推荐实现：SVG 方案

### SVG 结构
```svg
<svg width="100%" height="100%" class="tech-border-svg">
  <defs>
    <!-- 发光滤镜 -->
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <!-- 渐变 -->
    <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>
  
  <!-- 外边框路径（四角斜切） -->
  <path 
    d="M 20,0 L 280,0 L 300,20 L 300,180 L 280,200 L 20,200 L 0,180 L 0,20 Z"
    fill="none"
    stroke="url(#borderGradient)"
    stroke-width="2"
    filter="url(#glow)"
  />
  
  <!-- 四角装饰 -->
  <path d="M 0,20 L 20,20 L 20,0" fill="none" stroke="#0ea5e9" stroke-width="3"/>
  <path d="M 280,0 L 280,20 L 300,20" fill="none" stroke="#0ea5e9" stroke-width="3"/>
  <path d="M 300,180 L 280,180 L 280,200" fill="none" stroke="#0ea5e9" stroke-width="3"/>
  <path d="M 20,200 L 20,180 L 0,180" fill="none" stroke="#0ea5e9" stroke-width="3"/>
</svg>
```

### 容器布局
```html
<div class="tech-border-container">
  <!-- SVG 边框层 -->
  <svg class="border-layer">...</svg>
  
  <!-- 内容层 -->
  <div class="content-layer">
    <slot></slot>
  </div>
</div>
```

```css
.tech-border-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.border-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.content-layer {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  overflow: hidden;
}
```

## DataV 参考
dv-border-box-1 的实现：
- 使用 `viewBox="0 0 100 100"` 实现自适应
- 使用 `preserveAspectRatio="none"` 拉伸
- 内部内容通过 slot 分发到 `border-box-content` 容器

## 流动动画
```css
@keyframes flow {
  0% { stroke-dashoffset: 100; }
  100% { stroke-dashoffset: 0; }
}

.border-animated {
  stroke-dasharray: 10, 5;
  animation: flow 2s linear infinite;
}
```
