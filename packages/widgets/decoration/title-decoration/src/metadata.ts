/**
 * 标题装饰组件 - 元数据配置
 *
 * 支持：
 * - 大屏主标题（10 种变体）
 * - 区域标题栏（14 种变体）
 * - 主题色联动
 * - 动画效果
 */

export const metadata = {
  id: 'decoration-title',
  name: '标题装饰',
  category: 'decoration',
  icon: 'Heading',
  version: '1.0.0',
  order: 2,
  resizable: true,
  defaultSize: { width: 500, height: 40 },
  constraints: {},
} as const;
