import { PropsSchema } from './schema';
import {
  generateControls,
  chartGaugeFontControlOverrides,
} from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
    groups: {
        Content: ['max'],
        Style: ['primaryColor', 'axisLabelColor', 'detailColor', 'axisLabelFontSize', 'titleFontSize', 'detailFontSize'],
        Data: ['data'],
    },
    overrides: {
        primaryColor: { kind: 'color' },
        axisLabelColor: { kind: 'color', label: { zh: '刻度颜色', en: 'Axis Label Color' } },
        detailColor: { kind: 'color', label: { zh: '数值颜色', en: 'Detail Color' } },
        data: { kind: 'json' },
        ...chartGaugeFontControlOverrides,
    },
    bindings: {
        max: { enabled: true, modes: ['static', 'field', 'expr'] },
        primaryColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        axisLabelColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        detailColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        data: { enabled: true, modes: ['static', 'field', 'expr'] },
        axisLabelFontSize: { enabled: true, modes: ['static', 'field', 'expr'] },
        titleFontSize: { enabled: true, modes: ['static', 'field', 'expr'] },
        detailFontSize: { enabled: true, modes: ['static', 'field', 'expr'] },
    },
});
