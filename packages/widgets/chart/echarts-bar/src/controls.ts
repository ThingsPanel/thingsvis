import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
    groups: {
        Content: ['title', 'titleAlign', 'showLegend', 'showXAxis', 'showYAxis'],
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
    },
    bindings: {
        title: { enabled: true, modes: ['static', 'field', 'expr'] },
        titleAlign: { enabled: true, modes: ['static', 'field', 'expr'] },
        showXAxis: { enabled: true, modes: ['static', 'field', 'expr'] },
        showYAxis: { enabled: true, modes: ['static', 'field', 'expr'] },
        primaryColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        titleColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        axisLabelColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        data: { enabled: true, modes: ['static', 'field', 'expr'] },
    },
});
