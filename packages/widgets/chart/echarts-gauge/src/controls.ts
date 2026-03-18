import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
    groups: {
        Content: ['title', 'max'],
        Style: ['primaryColor'],
        Data: ['data'],
    },
    overrides: {
        title: { label: 'widgets.thingsvis-widget-chart-echarts-gauge.controls.title' },
        max: { label: 'widgets.thingsvis-widget-chart-echarts-gauge.controls.max' },
        primaryColor: {
            kind: 'color',
            label: 'widgets.thingsvis-widget-chart-echarts-gauge.controls.primaryColor',
        },
        data: {
            kind: 'json',
            label: 'widgets.thingsvis-widget-chart-echarts-gauge.controls.data',
        },
    },
    bindings: {
        title: { enabled: true, modes: ['static', 'field', 'expr'] },
        max: { enabled: true, modes: ['static', 'field', 'expr'] },
        primaryColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        data: { enabled: true, modes: ['static', 'field', 'expr'] },
    },
});
