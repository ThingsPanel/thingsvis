/**
 * 组件元数据配置
 */

export const metadata = {
  id: 'media-image',
  name: '图片',
  category: 'media',
  icon: 'Image',
  version: '1.0.0',
  resizable: true,
  defaultSize: { width: 200, height: 200 },
  constraints: { minWidth: 40, minHeight: 40 },
} as const;
