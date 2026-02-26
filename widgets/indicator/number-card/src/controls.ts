import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
    groups: {
        Content: ['title', 'value', 'unit'],
        Style: ['valueColor', 'titleColor', 'backgroundColor', 'borderRadius'],
    },
    overrides: {
        valueColor: { kind: 'color' },
        titleColor: { kind: 'color' },
        backgroundColor: { kind: 'color' },
        borderRadius: { kind: 'number', min: 0, max: 100, step: 1 },
    },
    bindings: {
        title: { enabled: true, modes: ['static', 'field', 'expr'] },
        value: { enabled: true, modes: ['static', 'field', 'expr'] },
        unit: { enabled: true, modes: ['static', 'field', 'expr'] },
        valueColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        titleColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        backgroundColor: { enabled: true, modes: ['static', 'field', 'expr'] },
    },
});
