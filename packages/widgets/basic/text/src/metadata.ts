/**
 * 组件元数据配置
 * 
 * 📝 开发指南：
 * - id: 组件唯一标识，格式为 "分类-名称"，如 "basic-text"
 * - name: 组件显示名称，会在 Studio 组件库中展示
 * - category: 组件分类，决定在组件库中的位置
 * - icon: 图标名称，使用 Lucide 图标库
 * - version: 版本号，遵循 SemVer 规范
 * - resizable: 是否支持手动调整尺寸（false = 自适应内容尺寸）
 */

export const metadata = {
  id: 'basic-text',
  name: '文本',
  category: 'basic',
  icon: 'Type',
  version: '1.0.0',
  order: 3,
  resizable: false, // 文本组件根据内容自适应尺寸
  defaultSize: { width: 160, height: 40 },
  constraints: { minWidth: 20, minHeight: 12 },
} as const;
