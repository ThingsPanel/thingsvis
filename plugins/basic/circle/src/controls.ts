/**
 * 属性面板控制配置
 */

import { PropsSchema } from './schema';
import { generateControls } from './lib/types';

export const controls = generateControls(PropsSchema, {
  // 属性分组配置
  groups: {
    Style: ['fill', 'stroke', 'strokeWidth', 'opacity'],
  },
  
  // 覆盖控件类型
  overrides: {
    fill: { kind: 'color' },
    stroke: { kind: 'color' },
  },
  
  // 数据绑定配置
  bindings: {
    fill: { enabled: true, modes: ['static', 'field', 'expr'] },
    opacity: { enabled: true, modes: ['static', 'field', 'expr'] },
  },
});
