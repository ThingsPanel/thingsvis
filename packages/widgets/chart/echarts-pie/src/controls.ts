import { PropsSchema } from './schema';
import {
    generateControls,
    chartPieFontControlOverrides,
    chartAxisFontBindings,
} from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
    groups: {
        Content: ['showLegend', 'isDoughnut'],
        Style: ['primaryColor', 'labelColor', 'legendFontSize', 'labelFontSize'],
        Data: ['data'],
    },
    overrides: {
        primaryColor: { kind: 'color' },
        labelColor: { kind: 'color', label: { zh: '标签颜色', en: 'Label Color' } },
        data: { kind: 'json' },
        ...chartPieFontControlOverrides,
    },
    bindings: {
        primaryColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        labelColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        data: { enabled: true, modes: ['static', 'field', 'expr'] },
        legendFontSize: chartAxisFontBindings.legendFontSize,
        labelFontSize: { enabled: true, modes: ['static', 'field', 'expr'] },
    },
});
