/**
 * 科技边框装饰组件 - 元数据配置
 * 
 * 支持：
 * - 四角斜切边框
 * - 发光效果
 * - 流动动画
 * - 内部内容容器
 */

export const metadata = {
  id: 'decoration-tech-border',
  name: '科技边框',
  category: 'decoration',
  icon: 'Frame',
  version: '1.0.0',
  order: 1,
  resizable: true,
  defaultSize: { width: 300, height: 200 },
  constraints: { minWidth: 60, minHeight: 40 },
} as const;
