/**
 * 属性面板控制配置
 * 
 * 📝 开发指南：
 * - 图表组件通常将 data 放在 Data 分组
 * - title 等放在 Content 分组
 * - 样式相关放在 Style 分组
 */

import { PropsSchema } from './schema';
import { generateControls } from './lib/types';

export const controls = generateControls(PropsSchema, {
  // 属性分组配置
  groups: {
    Content: ['title'],
    Data: ['data'],
    Style: ['lineColor', 'showArea', 'smooth', 'showSymbol', 'showLegend', 'backgroundColor'],
  },
  
  // 覆盖控件类型
  overrides: {
    lineColor: { kind: 'color' },
    backgroundColor: { kind: 'color' },
    data: { kind: 'json' },
  },
  
  // 数据绑定配置
  bindings: {
    title: { enabled: true, modes: ['static', 'field', 'expr'] },
    data: { enabled: true, modes: ['static', 'field', 'expr'] },
    lineColor: { enabled: true, modes: ['static', 'field', 'expr'] },
  },
});
