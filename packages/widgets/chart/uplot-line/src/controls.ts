import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
    groups: {
        Content: ['title', 'titleAlign', 'showLegend', 'timeRangePreset'],
        Style: ['primaryColor', 'titleColor', 'axisLabelColor'],
        Data: ['data'],
    },
    overrides: {
        primaryColor: { kind: 'color' },
        titleColor: { kind: 'color', label: { zh: '标题颜色', en: 'Title Color' } },
        axisLabelColor: { kind: 'color', label: { zh: '坐标文字颜色', en: 'Axis Label Color' } },
        data: { kind: 'json' },
        titleAlign: {
            kind: 'select',
            label: '标题对齐',
            options: [
                { label: '靠左', value: 'left' },
                { label: '居中', value: 'center' },
                { label: '靠右', value: 'right' },
            ],
        },
        timeRangePreset: {
            kind: 'select',
            label: '时间范围',
            options: [
                { label: '全部', value: 'all' },
                { label: '最近 1 小时', value: '1h' },
                { label: '最近 6 小时', value: '6h' },
                { label: '最近 24 小时', value: '24h' },
                { label: '最近 7 天', value: '7d' },
                { label: '最近 30 天', value: '30d' },
            ],
        },
    },
    bindings: {
        title: { enabled: true, modes: ['static', 'field', 'expr'] },
        titleAlign: { enabled: true, modes: ['static', 'field', 'expr'] },
        primaryColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        titleColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        axisLabelColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        showLegend: { enabled: true, modes: ['static', 'field', 'expr'] },
        data: { enabled: true, modes: ['static', 'field', 'expr'] },
    },
});
