import { PropsSchema } from './schema';
import { generateControls } from './lib/types';

export const controls = generateControls(PropsSchema, {
    groups: {
        Content: ['title', 'max'],
        Style: ['primaryColor'],
        Data: ['data'],
    },
    overrides: {
        primaryColor: { kind: 'color' },
        data: { kind: 'json' },
    },
    bindings: {
        title: { enabled: true, modes: ['static', 'field', 'expr'] },
        primaryColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        data: { enabled: true, modes: ['static', 'field', 'expr'] },
    },
});
