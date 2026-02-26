import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
    groups: {
        Data: ['columns', 'data'],
        Style: ['headerBg', 'headerColor', 'rowBg', 'rowColor', 'borderColor'],
    },
    overrides: {
        columns: { kind: 'json' },
        data: { kind: 'json' },
        headerBg: { kind: 'color' },
        headerColor: { kind: 'color' },
        rowBg: { kind: 'color' },
        rowColor: { kind: 'color' },
        borderColor: { kind: 'color' },
    },
    bindings: {
        columns: { enabled: true, modes: ['static', 'field', 'expr'] },
        data: { enabled: true, modes: ['static', 'field', 'expr'] },
    },
});
