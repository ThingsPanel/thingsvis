/**
 * 数据标签组件 - 元数据配置
 * 
 * 用于展示工业数据：[标签名] [数值] [单位]
 * 例如：瞬时流量 35.8 m³/h
 */

export const metadata = {
  id: 'industrial-data-tag',
  name: '数据标签',
  category: 'industrial',
  icon: 'Tag',
  version: '1.0.0',
  order: 1,
  resizable: false,
  defaultSize: { width: 140, height: 32 },
  constraints: { minWidth: 80, minHeight: 24 },
} as const;
