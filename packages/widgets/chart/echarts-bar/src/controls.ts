import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
    groups: {
        Content: ['title', 'titleAlign', 'showLegend', 'showXAxis', 'showYAxis'],
        Style: ['primaryColor'],
        Data: ['data'],
    },
    overrides: {
        title: { label: 'widgets.thingsvis-widget-chart-echarts-bar.controls.title' },
        showLegend: { label: 'widgets.thingsvis-widget-chart-echarts-bar.controls.showLegend' },
        showXAxis: { label: 'widgets.thingsvis-widget-chart-echarts-bar.controls.showXAxis' },
        showYAxis: { label: 'widgets.thingsvis-widget-chart-echarts-bar.controls.showYAxis' },
        primaryColor: {
            kind: 'color',
            label: 'widgets.thingsvis-widget-chart-echarts-bar.controls.primaryColor',
        },
        data: {
            kind: 'json',
            label: 'widgets.thingsvis-widget-chart-echarts-bar.controls.data',
        },
        titleAlign: {
            kind: 'select',
            label: 'widgets.thingsvis-widget-chart-echarts-bar.controls.titleAlign',
            options: [
                { label: 'widgets.thingsvis-widget-chart-echarts-bar.options.titleAlign.left', value: 'left' },
                { label: 'widgets.thingsvis-widget-chart-echarts-bar.options.titleAlign.center', value: 'center' },
                { label: 'widgets.thingsvis-widget-chart-echarts-bar.options.titleAlign.right', value: 'right' },
            ],
        },
    },
    bindings: {
        title: { enabled: true, modes: ['static', 'field', 'expr'] },
        titleAlign: { enabled: true, modes: ['static', 'field', 'expr'] },
        showXAxis: { enabled: true, modes: ['static', 'field', 'expr'] },
        showYAxis: { enabled: true, modes: ['static', 'field', 'expr'] },
        primaryColor: { enabled: true, modes: ['static', 'field', 'expr'] },
        data: { enabled: true, modes: ['static', 'field', 'expr'] },
    },
});
