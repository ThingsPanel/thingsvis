/**
 * 组件元数据配置
 */

export const metadata = {
  id: 'basic-rectangle',
  name: '矩形',
  category: 'basic',
  icon: 'Square',
  version: '1.0.0',
  order: 1,
  resizable: true,
  defaultSize: { width: 160, height: 100 },
  constraints: { minWidth: 20, minHeight: 20 },
} as const;
