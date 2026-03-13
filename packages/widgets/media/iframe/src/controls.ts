import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
    groups: {
        Data: ['src'],
        Style: ['borderWidth', 'borderColor', 'borderRadius'],
    },
    overrides: {
        borderColor: { kind: 'color' },
        borderWidth: { kind: 'number', min: 0, max: 20, step: 1 },
        borderRadius: { kind: 'number', min: 0, max: 100, step: 1 },
    },
    bindings: {
        src: { enabled: true, modes: ['static', 'field', 'expr'] },
    },
});
