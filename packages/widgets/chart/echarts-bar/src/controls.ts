import { PropsSchema } from './schema';
import {
  generateControls,
  chartAxisFontControlOverrides,
  chartAxisFontBindings,
} from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
    groups: {
        Content: ['showLegend', 'showXAxis', 'showYAxis'],
        Style: ['primaryColor', 'axisLabelColor', 'xAxisFontSize', 'yAxisFontSize', 'legendFontSize'],
        Data: ['data'],
    },
    overrides: {
        primaryColor: { kind: 'color' },
        axisLabelColor: { kind: 'color', label: { zh: '坐标文字颜色', en: 'Axis Label Color' } },
        data: { kind: 'json' },
        ...chartAxisFontControlOverrides,
    },
    bindings: {
        showXAxis: { enabled: true, modes: ['static', 'field', 'expr'] },
        showYAxis: { enabled: true, modes: ['static', 'field', 'expr'] },
        primaryColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        axisLabelColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        data: { enabled: true, modes: ['static', 'field', 'expr'] },
        ...chartAxisFontBindings,
    },
});
