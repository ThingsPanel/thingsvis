/**
 * 分隔装饰组件 - 元数据配置
 *
 * 支持：
 * - 扫描渐变条
 * - 竖线滑动
 * - 六边形链
 * - 信号波形
 * - 主题色联动 + 动画
 */

export const metadata = {
  id: 'decoration-divider',
  name: '分隔装饰',
  category: 'decoration',
  icon: 'Minus',
  version: '1.0.0',
  order: 3,
  resizable: true,
  defaultSize: { width: 500, height: 20 },
  constraints: { minWidth: 100, minHeight: 8 },
} as const;
