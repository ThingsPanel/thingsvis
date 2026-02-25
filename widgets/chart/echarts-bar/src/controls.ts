/**
 * 属性面板控制配置
 *
 * 柱状图的属性分组与控件类型定义
 */

import { PropsSchema } from './schema';
import { generateControls } from './lib/types';

export const controls = generateControls(PropsSchema, {
    // 属性分组配置
    groups: {
        Content: ['title'],
        Data: ['data'],
        Style: ['barColor', 'barWidth', 'showLabel', 'showLegend', 'barBorderRadius', 'backgroundColor'],
    },

    // 覆盖控件类型
    overrides: {
        barColor: { kind: 'color' },
        backgroundColor: { kind: 'color' },
        data: { kind: 'json' },
    },

    // 数据绑定配置
    bindings: {
        title: { enabled: true, modes: ['static', 'field', 'expr'] },
        data: { enabled: true, modes: ['static', 'field', 'expr'] },
        barColor: { enabled: true, modes: ['static', 'field', 'expr'] },
    },
});
