import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
    groups: {
        Content: ['title', 'showLegend', 'isDoughnut'],
        Style: ['primaryColor'],
        Data: ['data'],
    },
    overrides: {
        title: { label: 'widgets.thingsvis-widget-chart-echarts-pie.controls.title' },
        showLegend: { label: 'widgets.thingsvis-widget-chart-echarts-pie.controls.showLegend' },
        isDoughnut: { label: 'widgets.thingsvis-widget-chart-echarts-pie.controls.isDoughnut' },
        primaryColor: {
            kind: 'color',
            label: 'widgets.thingsvis-widget-chart-echarts-pie.controls.primaryColor',
        },
        data: {
            kind: 'json',
            label: 'widgets.thingsvis-widget-chart-echarts-pie.controls.data',
        },
    },
    bindings: {
        title: { enabled: true, modes: ['static', 'field', 'expr'] },
        primaryColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        data: { enabled: true, modes: ['static', 'field', 'expr'] },
    },
});
