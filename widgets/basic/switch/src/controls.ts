import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
    groups: {
        Data: ['value'],
        Style: ['activeColor', 'inactiveColor'],
    },
    overrides: {
        activeColor: { kind: 'color' },
        inactiveColor: { kind: 'color' },
    },
    bindings: {
        value: { enabled: true, modes: ['static', 'field', 'expr'] },
    },
});
