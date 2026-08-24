import { createControlPanel, type ControlBinding } from '@thingsvis/widget-sdk';

const binding: ControlBinding = { enabled: true, modes: ['static', 'field', 'expr'] };

export const controls = createControlPanel()
  .addGroup('GaugeBasic', (b) => {
    b.addNumberInput('precision', { label: { zh: '小数位数', en: 'Decimal Places' }, min: 0, max: 6, step: 1, binding });
    b.addSelect('colorMode', {
      label: { zh: '颜色方案', en: 'Color Scheme' },
      options: [
        { label: { zh: '单色', en: 'Single Color' }, value: 'single' },
        { label: { zh: '三段自定义', en: 'Custom Three Sections' }, value: 'three' },
        { label: { zh: 'AQI 空气质量', en: 'AQI Air Quality' }, value: 'aqi' },
      ],
    });
  }, { label: { zh: '基础设置', en: 'Basic Settings' } })
  .addGroup('GaugeSingleRange', (b) => {
    b.addNumberInput('min', { label: { zh: '最小值', en: 'Minimum' }, binding });
    b.addNumberInput('max', { label: { zh: '最大值', en: 'Maximum' }, binding });
    b.addTextInput('unit', { label: { zh: '单位', en: 'Unit' }, binding });
  }, { label: { zh: '数值范围', en: 'Value Range' }, showWhen: { field: 'colorMode', value: 'single' } })
  .addGroup('GaugeThreeRange', (b) => {
    b.addNumberInput('min', { label: { zh: '最小值', en: 'Minimum' }, binding });
    b.addNumberInput('max', { label: { zh: '最大值', en: 'Maximum' }, binding });
    b.addTextInput('unit', { label: { zh: '单位', en: 'Unit' }, binding });
  }, { label: { zh: '数值范围', en: 'Value Range' }, showWhen: { field: 'colorMode', value: 'three' } })
  .addGroup('GaugeSections', (b) => {
    b.addNumberInput('lowMax', { label: { zh: '低值上限', en: 'Low Range Maximum' } });
    b.addNumberInput('mediumMax', { label: { zh: '中值上限', en: 'Medium Range Maximum' } });
    b.addColorPicker('lowColor', { label: { zh: '低值颜色', en: 'Low Range Color' } });
    b.addColorPicker('mediumColor', { label: { zh: '中值颜色', en: 'Medium Range Color' } });
    b.addColorPicker('highColor', { label: { zh: '高值颜色', en: 'High Range Color' } });
  }, { label: { zh: '三段颜色', en: 'Three-Section Colors' }, showWhen: { field: 'colorMode', value: 'three' } })
  .addGroup('GaugeAqi', (b) => {
    b.addSelect('aqiInputType', {
      label: { zh: '数据类型', en: 'Input Type' },
      description: { zh: '明确指定绑定值是 AQI 还是 PM2.5 浓度', en: 'Specify whether the bound value is AQI or PM2.5 concentration' },
      options: [
        { label: { zh: 'AQI 指数', en: 'AQI Index' }, value: 'aqi' },
        { label: { zh: 'PM2.5 浓度（μg/m³）', en: 'PM2.5 Concentration (μg/m³)' }, value: 'pm25' },
      ],
    });
  }, { label: { zh: 'AQI 设置', en: 'AQI Settings' }, showWhen: { field: 'colorMode', value: 'aqi' } })
  .addGroup('GaugeDisplay', (b) => {
    b.addSwitch('showProgress', { label: { zh: '显示进度弧', en: 'Show Progress Arc' } });
    b.addSwitch('showPointer', { label: { zh: '显示指针', en: 'Show Pointer' } });
    b.addSwitch('showAxisLabels', { label: { zh: '显示刻度数值', en: 'Show Scale Values' } });
  }, { label: { zh: '显示设置', en: 'Display' } })
  .addGroup('GaugeStyle', (b) => {
    b.addColorPicker('primaryColor', {
      label: { zh: '主题颜色', en: 'Primary Color' },
      binding,
      showWhen: { field: 'colorMode', value: 'single' },
    });
    b.addColorPicker('axisLabelColor', { label: { zh: '刻度颜色', en: 'Scale Color' }, binding });
    b.addColorPicker('detailColor', {
      label: { zh: '数值颜色', en: 'Value Color' },
      binding,
      showWhen: { field: 'colorMode', value: 'single' },
    });
    b.addNumberInput('axisLabelFontSize', { label: { zh: '刻度字号', en: 'Scale Font Size' }, min: 8, max: 72, step: 1 });
    b.addNumberInput('titleFontSize', { label: { zh: '标题字号', en: 'Title Font Size' }, min: 8, max: 72, step: 1 });
    b.addNumberInput('detailFontSize', { label: { zh: '数值字号', en: 'Value Font Size' }, min: 8, max: 96, step: 1 });
  }, { label: { zh: '样式', en: 'Style' } })
  .addGroup('Advanced', (b) => {
    b.addNumberInput('startAngle', { label: { zh: '起始角度', en: 'Start Angle' }, min: -360, max: 360 });
    b.addNumberInput('endAngle', { label: { zh: '结束角度', en: 'End Angle' }, min: -360, max: 360 });
    b.addNumberInput('splitNumber', { label: { zh: '刻度段数', en: 'Scale Segments' }, min: 1, max: 100, step: 1 });
    b.addSwitch('showAxisTicks', { label: { zh: '显示小刻度', en: 'Show Minor Ticks' } });
    b.addSwitch('showSplitLines', { label: { zh: '显示主刻度线', en: 'Show Major Ticks' } });
  }, { label: { zh: '高级', en: 'Advanced' }, expanded: false })
  .addGroup('Data', (b) => {
    b.addJsonEditor('data', { label: { zh: '仪表数据', en: 'Gauge Data' }, binding: true });
  }, { label: { zh: '数据', en: 'Data' } })
  .build();
