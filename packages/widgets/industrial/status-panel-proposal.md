# Status Panel 组件实现方案

## 视觉分析

### 故障警告牌
```
┌──────────────────────────┐
│   ⚠ 循环变频故障          │  ← 红色背景，呼吸灯边框
└──────────────────────────┘
```

### 水泵控制面板
```
┌──────────────────────┐
│  手动    [开/关]      │  ← 模式切换 + 开关按钮
│  自动                │
└──────────────────────┘
```

## Props 设计
```typescript
{
  // 状态类型
  type: 'alarm' | 'control' | 'indicator';
  
  // 报警模式 (type='alarm')
  alarmText: string;       // 报警文本
  alarmLevel: 'warning' | 'error' | 'critical';
  flashing: boolean;       // 是否呼吸闪烁
  
  // 控制模式 (type='control')
  title: string;           // 标题，如 "NO.1补水泵"
  mode: 'manual' | 'auto'; // 当前模式
  switchState: 'on' | 'off'; // 开关状态
  onModeChange: (mode: string) => void;
  onSwitchChange: (state: string) => void;
  
  // 指示器模式 (type='indicator')
  status: 'normal' | 'warning' | 'error';
  label: string;
  
  // 通用样式
  width: number;
  height: number;
  themeColor: string;      // 主题色
}
```

## 呼吸灯动画 CSS
```css
@keyframes breathe {
  0%, 100% { 
    box-shadow: 0 0 5px rgba(255, 77, 79, 0.4);
    border-color: rgba(255, 77, 79, 0.6);
  }
  50% { 
    box-shadow: 0 0 20px rgba(255, 77, 79, 0.8);
    border-color: rgba(255, 77, 79, 1);
  }
}

.status-alarm {
  animation: breathe 2s ease-in-out infinite;
}
```

## 参考实现
industrial/pump 组件已有闪烁动画 (line 75-78)：
```svg
<circle cx="50" cy="50" r="28" fill="none" stroke="#ff4d4f" stroke-width="3" opacity="0.6">
  <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite"/>
</circle>
```

## 控制面板交互
- 手动/自动：Segmented 切换
- 开/关：Switch 开关
- 建议用 HTML button 元素，不要用 SVG，便于点击
