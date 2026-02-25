/**
 * 属性面板控制配置
 *
 * 饼图的属性分组与控件类型定义
 */

import { PropsSchema } from './schema';
import { generateControls } from './lib/types';

export const controls = generateControls(PropsSchema, {
    // 属性分组配置
    groups: {
        Content: ['title'],
        Data: ['data'],
        Style: ['radius', 'innerRadius', 'showLegend', 'showLabel', 'labelType', 'roseType', 'backgroundColor'],
    },

    // 覆盖控件类型
    overrides: {
        backgroundColor: { kind: 'color' },
        data: { kind: 'json' },
        labelType: { kind: 'select' },
    },

    // 数据绑定配置
    bindings: {
        title: { enabled: true, modes: ['static', 'field', 'expr'] },
        data: { enabled: true, modes: ['static', 'field', 'expr'] },
    },
});
