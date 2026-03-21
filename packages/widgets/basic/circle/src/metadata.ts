/**
 * 组件元数据配置
 */

export const metadata = {
  id: 'basic-circle',
  name: '圆形',
  category: 'basic',
  icon: 'Circle',
  version: '1.0.0',
  order: 2,
  resizable: true,
  defaultSize: { width: 100, height: 100 },
  constraints: { minWidth: 20, minHeight: 20 },
} as const;
