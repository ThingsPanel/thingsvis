import { PropsSchema } from './schema';
import {
  generateControls,
  chartGaugeFontControlOverrides,
} from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
    groups: {
        Content: ['min', 'max', 'unit', 'precision'],
        Scale: ['startAngle', 'endAngle', 'splitNumber', 'showAxisTicks', 'showSplitLines', 'showAxisLabels'],
        Thresholds: ['thresholds', 'showRangeLabels', 'useThresholdColor'],
        Style: ['primaryColor', 'axisLabelColor', 'detailColor', 'showProgress', 'showPointer', 'axisLabelFontSize', 'titleFontSize', 'detailFontSize'],
        Data: ['data'],
    },
    overrides: {
        primaryColor: { kind: 'color' },
        axisLabelColor: { kind: 'color', label: { zh: '刻度颜色', en: 'Axis Label Color' } },
        detailColor: { kind: 'color', label: { zh: '数值颜色', en: 'Detail Color' } },
        thresholds: { kind: 'json', label: { zh: '颜色区间', en: 'Thresholds' } },
        data: { kind: 'json' },
        ...chartGaugeFontControlOverrides,
    },
    bindings: {
        max: { enabled: true, modes: ['static', 'field', 'expr'] },
        min: { enabled: true, modes: ['static', 'field', 'expr'] },
        unit: { enabled: true, modes: ['static', 'field', 'expr'] },
        precision: { enabled: true, modes: ['static', 'field', 'expr'] },
        primaryColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        axisLabelColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        detailColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        data: { enabled: true, modes: ['static', 'field', 'expr'] },
        axisLabelFontSize: { enabled: true, modes: ['static', 'field', 'expr'] },
        titleFontSize: { enabled: true, modes: ['static', 'field', 'expr'] },
        detailFontSize: { enabled: true, modes: ['static', 'field', 'expr'] },
    },
});
