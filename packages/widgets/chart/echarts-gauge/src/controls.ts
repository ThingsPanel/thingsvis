import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
    groups: {
        Content: ['title', 'max'],
        Style: ['primaryColor', 'titleColor', 'axisLabelColor', 'detailColor'],
        Data: ['data'],
    },
    overrides: {
        primaryColor: { kind: 'color' },
        titleColor: { kind: 'color', label: { zh: '标题颜色', en: 'Title Color' } },
        axisLabelColor: { kind: 'color', label: { zh: '刻度颜色', en: 'Axis Label Color' } },
        detailColor: { kind: 'color', label: { zh: '数值颜色', en: 'Detail Color' } },
        data: { kind: 'json' },
    },
    bindings: {
        title: { enabled: true, modes: ['static', 'field', 'expr'] },
        max: { enabled: true, modes: ['static', 'field', 'expr'] },
        primaryColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        titleColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        axisLabelColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        detailColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        data: { enabled: true, modes: ['static', 'field', 'expr'] },
    },
});
