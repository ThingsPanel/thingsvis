import type { PluginControls } from './lib/types';

export const controls: PluginControls = {
  groups: [
    {
      id: 'Content',
      fields: [
        { path: 'label', label: '标题', kind: 'string', binding: { enabled: true, modes: ['static', 'field', 'expr'] } },
        { path: 'value', label: '数值', kind: 'string', binding: { enabled: true, modes: ['static', 'field', 'expr'] } },
        { path: 'unit', label: '单位', kind: 'string' }
      ]
    },
    {
      id: 'Style',
      fields: [
        { path: 'textColor', label: '文字颜色', kind: 'color' },
        { path: 'accentColor', label: '强调色', kind: 'color' },
        { path: 'backgroundColor', label: '背景色', kind: 'color' }
      ]
    }
  ]
};
