import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
    groups: {
        Content: ['title', 'showLegend', 'isDoughnut'],
        Style: ['primaryColor', 'titleColor', 'labelColor'],
        Data: ['data'],
    },
    overrides: {
        primaryColor: { kind: 'color' },
        titleColor: { kind: 'color', label: { zh: '标题颜色', en: 'Title Color' } },
        labelColor: { kind: 'color', label: { zh: '标签颜色', en: 'Label Color' } },
        data: { kind: 'json' },
    },
    bindings: {
        title: { enabled: true, modes: ['static', 'field', 'expr'] },
        primaryColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        titleColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        labelColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        data: { enabled: true, modes: ['static', 'field', 'expr'] },
    },
});
