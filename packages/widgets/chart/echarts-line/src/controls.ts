import { PropsSchema } from './schema';
import {
  generateControls,
  chartAxisFontControlOverrides,
  chartAxisFontBindings,
} from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
  groups: {
    Content: ['seriesName', 'showLegend', 'showXAxis', 'showYAxis', 'timeRangePreset'],
    Style: ['primaryColor', 'axisLabelColor', 'xAxisFontSize', 'yAxisFontSize', 'legendFontSize', 'smooth', 'showArea'],
    Data: ['data'],
  },
  overrides: {
    seriesName: {
      label: 'widgets.thingsvis-widget-chart-echarts-line.controls.seriesName',
      placeholder: { zh: '留空则显示「值1」', en: 'Empty shows "Value 1"' },
    },
    showLegend: { label: 'widgets.thingsvis-widget-chart-echarts-line.controls.showLegend' },
    showXAxis: { label: 'widgets.thingsvis-widget-chart-echarts-line.controls.showXAxis' },
    showYAxis: { label: 'widgets.thingsvis-widget-chart-echarts-line.controls.showYAxis' },
    primaryColor: {
      kind: 'color',
      label: 'widgets.thingsvis-widget-chart-echarts-line.controls.primaryColor',
    },
    axisLabelColor: {
      kind: 'color',
      label: 'widgets.thingsvis-widget-chart-echarts-line.controls.axisLabelColor',
    },
    smooth: { label: 'widgets.thingsvis-widget-chart-echarts-line.controls.smooth' },
    showArea: { label: 'widgets.thingsvis-widget-chart-echarts-line.controls.showArea' },
    data: {
      kind: 'json',
      label: 'widgets.thingsvis-widget-chart-echarts-line.controls.data',
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
    ...chartAxisFontControlOverrides,
  },
  bindings: {
    seriesName: { enabled: true, modes: ['static', 'field', 'expr'] },
    showXAxis: { enabled: true, modes: ['static', 'field', 'expr'] },
    showYAxis: { enabled: true, modes: ['static', 'field', 'expr'] },
    primaryColor: { enabled: true, modes: ['static', 'field', 'expr'] },
    axisLabelColor: { enabled: true, modes: ['static', 'field', 'expr'] },
    data: { enabled: true, modes: ['static', 'field', 'expr'] },
    ...chartAxisFontBindings,
  },
});
