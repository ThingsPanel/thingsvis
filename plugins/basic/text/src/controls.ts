/**
 * 属性面板控制配置
 * 
 * 📝 开发指南：
 * - 此文件配置组件在 Studio 属性面板中的展示方式
 * - 默认从 PropsSchema 自动生成，大多数情况无需修改
 * 
 * 🔧 可自定义内容：
 * - groups: 属性分组和顺序
 * - overrides: 覆盖特定属性的控件类型（如将 fill 设为 'color'）
 * - bindings: 配置哪些属性支持数据绑定
 * 
 * 💡 绑定模式说明：
 * - static: 静态值输入
 * - field: 从数据源字段选择
 * - expr: 表达式编辑器（高级用户）
 * - rule: 条件规则（预留）
 */

import { PropsSchema } from './schema';
import { generateControls } from './lib/types';

export const controls = generateControls(PropsSchema, {
  // 属性分组配置
  groups: {
    Content: ['text'],
    Style: ['fill', 'fontSize', 'fontWeight', 'textAlign', 'fontFamily'],
  },
  
  // 覆盖控件类型
  overrides: {
    fill: { kind: 'color' },
  },
  
  // 数据绑定配置
  bindings: {
    text: { enabled: true, modes: ['static', 'field', 'expr'] },
    fill: { enabled: true, modes: ['static', 'field', 'expr'] },
    fontSize: { enabled: true, modes: ['static', 'field', 'expr'] },
  },
});
