import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
    groups: {
        Content: ['showLegend', 'isDoughnut'],
        Style: ['primaryColor', 'labelColor'],
        Data: ['data'],
    },
    overrides: {
        primaryColor: { kind: 'color' },
        labelColor: { kind: 'color', label: { zh: '标签颜色', en: 'Label Color' } },
        data: { kind: 'json' },
    },
    bindings: {
        primaryColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        labelColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        data: { enabled: true, modes: ['static', 'field', 'expr'] },
    },
});
