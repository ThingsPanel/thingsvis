import { PropsSchema } from './schema';
import {
  generateControls,
  chartGaugeFontControlOverrides,
} from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
    groups: {
        Basic: ['min', 'max', 'unit', 'precision', 'colorMode', 'aqiInputType'],
        Sections: ['lowMax', 'mediumMax', 'lowColor', 'mediumColor', 'highColor'],
        Display: ['showProgress', 'showPointer', 'showAxisLabels'],
        Style: ['primaryColor', 'axisLabelColor', 'detailColor', 'axisLabelFontSize', 'titleFontSize', 'detailFontSize'],
        Advanced: ['startAngle', 'endAngle', 'splitNumber', 'showAxisTicks', 'showSplitLines'],
        Data: ['data'],
    },
    overrides: {
        primaryColor: { kind: 'color' },
        axisLabelColor: { kind: 'color', label: { zh: '刻度颜色', en: 'Axis Label Color' } },
        detailColor: { kind: 'color', label: { zh: '数值颜色', en: 'Detail Color' } },
        colorMode: { kind: 'select', label: { zh: '颜色方案', en: 'Color Scheme' }, options: [
            { label: { zh: '单色', en: 'Single Color' }, value: 'single' },
            { label: { zh: '三段自定义', en: 'Custom Three Sections' }, value: 'three' },
            { label: { zh: 'AQI 空气质量', en: 'AQI Air Quality' }, value: 'aqi' },
        ] },
        aqiInputType: { kind: 'select', label: { zh: 'AQI 数据来源', en: 'AQI Data Source' }, options: [
            { label: { zh: '设备直接上报 AQI', en: 'Device Reports AQI' }, value: 'aqi' },
            { label: { zh: '设备上报 PM2.5 浓度', en: 'Device Reports PM2.5' }, value: 'pm25' },
        ] },
        lowColor: { kind: 'color' },
        mediumColor: { kind: 'color' },
        highColor: { kind: 'color' },
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
