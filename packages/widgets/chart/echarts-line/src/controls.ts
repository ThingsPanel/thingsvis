import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
  groups: {
    Content: ['title', 'titleAlign', 'showLegend', 'showXAxis', 'showYAxis', 'timeRangePreset'],
    Style: ['primaryColor', 'smooth', 'showArea'],
    Data: ['data'],
  },
  overrides: {
    title: { label: 'widgets.thingsvis-widget-chart-echarts-line.controls.title' },
    showLegend: { label: 'widgets.thingsvis-widget-chart-echarts-line.controls.showLegend' },
    showXAxis: { label: 'widgets.thingsvis-widget-chart-echarts-line.controls.showXAxis' },
    showYAxis: { label: 'widgets.thingsvis-widget-chart-echarts-line.controls.showYAxis' },
    primaryColor: {
      kind: 'color',
      label: 'widgets.thingsvis-widget-chart-echarts-line.controls.primaryColor',
    },
    smooth: { label: 'widgets.thingsvis-widget-chart-echarts-line.controls.smooth' },
    showArea: { label: 'widgets.thingsvis-widget-chart-echarts-line.controls.showArea' },
    data: {
      kind: 'json',
      label: 'widgets.thingsvis-widget-chart-echarts-line.controls.data',
    },
    titleAlign: {
      kind: 'select',
      label: 'widgets.thingsvis-widget-chart-echarts-line.controls.titleAlign',
      options: [
        { label: 'widgets.thingsvis-widget-chart-echarts-line.options.titleAlign.left', value: 'left' },
        { label: 'widgets.thingsvis-widget-chart-echarts-line.options.titleAlign.center', value: 'center' },
        { label: 'widgets.thingsvis-widget-chart-echarts-line.options.titleAlign.right', value: 'right' },
      ],
    },
    timeRangePreset: {
      kind: 'select',
      label: 'widgets.thingsvis-widget-chart-echarts-line.controls.timeRangePreset',
      options: [
        { label: 'widgets.thingsvis-widget-chart-echarts-line.options.timeRangePreset.all', value: 'all' },
        { label: 'widgets.thingsvis-widget-chart-echarts-line.options.timeRangePreset.1h', value: '1h' },
        { label: 'widgets.thingsvis-widget-chart-echarts-line.options.timeRangePreset.6h', value: '6h' },
        { label: 'widgets.thingsvis-widget-chart-echarts-line.options.timeRangePreset.24h', value: '24h' },
        { label: 'widgets.thingsvis-widget-chart-echarts-line.options.timeRangePreset.7d', value: '7d' },
        { label: 'widgets.thingsvis-widget-chart-echarts-line.options.timeRangePreset.30d', value: '30d' },
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
