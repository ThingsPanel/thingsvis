/**
 * 组件元数据配置
 * 
 * 📝 开发指南：
 * - id: 组件唯一标识，格式为 "分类-名称"，如 "basic-text"
 * - name: 组件显示名称，会在 Studio 组件库中展示
 * - category: 组件分类，决定在组件库中的位置
 * - icon: 图标名称，使用 Lucide 图标库
 * - version: 版本号，遵循 SemVer 规范
 */

export const metadata = {
  id: 'basic-text',
  name: '基础文本',
  category: 'basic',
  icon: 'Type',
  version: '1.0.0',
} as const;
