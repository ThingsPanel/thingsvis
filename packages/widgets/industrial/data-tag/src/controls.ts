/**
 * Data Tag 组件控制面板配置
 */

import { createControlPanel } from '@thingsvis/widget-sdk';

export const controls = createControlPanel()
  // ============================================
  // 数据内容组
  // ============================================
  .addContentGroup((builder) => {
    builder
      .addTextInput('label', {
        label: 'widgets.thingsvis-widget-industrial-data-tag.label_1',
        default: '标签',
        binding: false,
      })
      .addTextInput('value', {
        label: 'widgets.thingsvis-widget-industrial-data-tag.label_2',
        default: '--',
        binding: true,
      })
      .addTextInput('unit', {
        label: 'widgets.thingsvis-widget-industrial-data-tag.label_3',
        default: '',
        binding: false,
      });
  })

  // ============================================
  // 颜色配置组
  // ============================================
  .addGroup('Colors', (builder) => {
    builder
      .addColorPicker('labelColor', {
        label: 'widgets.thingsvis-widget-industrial-data-tag.label_4',
        default: '',
      })
      .addColorPicker('valueColor', {
        label: 'widgets.thingsvis-widget-industrial-data-tag.label_5',
        default: '#ff4d4f',
      })
      .addColorPicker('unitColor', {
        label: 'widgets.thingsvis-widget-industrial-data-tag.label_6',
        default: '',
      });
  }, { label: { zh: '颜色', en: 'Colors' } })

  // ============================================
  // 字体设置组
  // ============================================
  .addGroup('Font', (builder) => {
    builder
      .addSlider('fontSize', {
        label: 'widgets.thingsvis-widget-industrial-data-tag.label_7',
        min: 8,
        max: 72,
        default: 14,
      })
      .addSlider('valueScale', {
        label: 'widgets.thingsvis-widget-industrial-data-tag.label_8',
        min: 0.5,
        max: 3,
        step: 0.1,
        default: 1.2,
      })
      .addSlider('unitScale', {
        label: 'widgets.thingsvis-widget-industrial-data-tag.label_9',
        min: 0.5,
        max: 2,
        step: 0.1,
        default: 0.85,
      })
      .addSwitch('valueBold', {
        label: 'widgets.thingsvis-widget-industrial-data-tag.label_10',
        default: true,
      });
  }, { label: { zh: '字体', en: 'Font' } })

  // ============================================
  // 布局组
  // ============================================
  .addGroup('Layout', (builder) => {
    builder
      .addSegmented('layout', {
        label: 'widgets.thingsvis-widget-industrial-data-tag.label_11',
        options: [
          { label: 'widgets.thingsvis-widget-industrial-data-tag.label_12', value: 'row', icon: 'AlignHorizontalSpaceAround' },
          { label: 'widgets.thingsvis-widget-industrial-data-tag.label_13', value: 'compact', icon: 'AlignVerticalSpaceAround' },
        ],
      })
      .addSlider('gap', {
        label: 'widgets.thingsvis-widget-industrial-data-tag.label_14',
        min: 0,
        max: 20,
        default: 6,
      })
      .addSegmented('align', {
        label: 'widgets.thingsvis-widget-industrial-data-tag.label_15',
        options: [
          { label: 'widgets.thingsvis-widget-industrial-data-tag.label_16', value: 'left', icon: 'AlignLeft' },
          { label: 'widgets.thingsvis-widget-industrial-data-tag.label_17', value: 'center', icon: 'AlignCenter' },
          { label: 'widgets.thingsvis-widget-industrial-data-tag.label_18', value: 'right', icon: 'AlignRight' },
        ],
      });
  }, { label: { zh: '布局', en: 'Layout' } })

  // ============================================
  // 背景样式组
  // ============================================
  .addGroup('Background', (builder) => {
    builder
      .addColorPicker('backgroundColor', {
        label: 'widgets.thingsvis-widget-industrial-data-tag.label_19',
        default: 'rgba(0,0,0,0.3)',
      })
      .addColorPicker('borderColor', {
        label: 'widgets.thingsvis-widget-industrial-data-tag.label_20',
        default: '',
      })
      .addSlider('borderRadius', {
        label: 'widgets.thingsvis-widget-industrial-data-tag.label_21',
        min: 0,
        max: 20,
        default: 4,
      })
      .addSlider('padding', {
        label: 'widgets.thingsvis-widget-industrial-data-tag.label_22',
        min: 0,
        max: 20,
        default: 6,
      });
  }, { label: { zh: '背景', en: 'Background' }, expanded: false })

  .build();
