/**
 * 属性面板控制配置
 */

import { PropsSchema } from './schema';
import { generateControls } from './lib/types';

export const controls = generateControls(PropsSchema, {
  // 属性分组配置
  groups: {
    Content: ['dataUrl'],
    Style: ['opacity', 'objectFit', 'cornerRadius', 'borderColor', 'borderWidth'],
  },
  
  // 覆盖控件类型
  overrides: {
    dataUrl: { kind: 'image' },
    borderColor: { kind: 'color' },
  },
  
  // 数据绑定配置
  bindings: {
    dataUrl: { enabled: true, modes: ['static', 'field', 'expr'] },
    opacity: { enabled: true, modes: ['static', 'field', 'expr'] },
  },
});
