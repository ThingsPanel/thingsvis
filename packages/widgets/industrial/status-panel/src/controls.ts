/**
 * Status Panel 组件控制面板配置
 */

import { createControlPanel } from '@thingsvis/widget-sdk';

export const controls = createControlPanel()
  // ============================================
  // 基础配置组
  // ============================================
  .addContentGroup((builder) => {
    builder
      .addSelect('type', {
        label: 'widgets.thingsvis-widget-industrial-status-panel.label_1',
        options: [
          { label: 'widgets.thingsvis-widget-industrial-status-panel.label_2', value: 'alarm' },
          { label: 'widgets.thingsvis-widget-industrial-status-panel.label_3', value: 'control' },
          { label: 'widgets.thingsvis-widget-industrial-status-panel.label_4', value: 'indicator' },
        ],
        default: 'indicator',
      })
      .addTextInput('title', {
        label: 'widgets.thingsvis-widget-industrial-status-panel.label_5',
        default: '设备',
      });
  })

  // ============================================
  // 报警配置组
  // ============================================
  .addGroup('Alarm', (builder) => {
    builder
      .addTextInput('alarmText', {
        label: 'widgets.thingsvis-widget-industrial-status-panel.label_6',
        default: '故障',
      })
      .addSelect('alarmLevel', {
        label: 'widgets.thingsvis-widget-industrial-status-panel.label_7',
        options: [
          { label: 'widgets.thingsvis-widget-industrial-status-panel.label_8', value: 'warning' },
          { label: 'widgets.thingsvis-widget-industrial-status-panel.label_9', value: 'error' },
          { label: 'widgets.thingsvis-widget-industrial-status-panel.label_10', value: 'critical' },
        ],
        default: 'error',
      })
      .addSwitch('flashing', {
        label: 'widgets.thingsvis-widget-industrial-status-panel.label_11',
        default: true,
      })
      .addSlider('flashSpeed', {
        label: 'widgets.thingsvis-widget-industrial-status-panel.label_12',
        min: 0.5,
        max: 5,
        step: 0.5,
        default: 1,
        showWhen: { field: 'flashing', value: true },
      });
  }, { 
    label: { zh: '报警设置', en: 'Alarm Settings' },
    showWhen: { field: 'type', value: 'alarm' }
  })

  // ============================================
  // 控制配置组
  // ============================================
  .addGroup('Control', (builder) => {
    builder
      .addSegmented('mode', {
        label: 'widgets.thingsvis-widget-industrial-status-panel.label_13',
        options: [
          { label: 'widgets.thingsvis-widget-industrial-status-panel.label_14', value: 'manual', icon: 'Hand' },
          { label: 'widgets.thingsvis-widget-industrial-status-panel.label_15', value: 'auto', icon: 'Bot' },
        ],
      })
      .addSegmented('switchState', {
        label: 'widgets.thingsvis-widget-industrial-status-panel.label_16',
        options: [
          { label: 'widgets.thingsvis-widget-industrial-status-panel.label_17', value: 'on', icon: 'Power' },
          { label: 'widgets.thingsvis-widget-industrial-status-panel.label_18', value: 'off' },
        ],
      })
      .addSwitch('showModeSwitch', {
        label: 'widgets.thingsvis-widget-industrial-status-panel.label_19',
        default: true,
      })
      .addSwitch('showSwitch', {
        label: 'widgets.thingsvis-widget-industrial-status-panel.label_20',
        default: true,
      });
  }, { 
    label: { zh: '控制设置', en: 'Control Settings' },
    showWhen: { field: 'type', value: 'control' }
  })

  // ============================================
  // 指示器配置组
  // ============================================
  .addGroup('Indicator', (builder) => {
    builder
      .addSelect('status', {
        label: 'widgets.thingsvis-widget-industrial-status-panel.label_21',
        options: [
          { label: 'widgets.thingsvis-widget-industrial-status-panel.label_22', value: 'normal' },
          { label: 'widgets.thingsvis-widget-industrial-status-panel.label_23', value: 'warning' },
          { label: 'widgets.thingsvis-widget-industrial-status-panel.label_24', value: 'error' },
          { label: 'widgets.thingsvis-widget-industrial-status-panel.label_25', value: 'offline' },
        ],
      })
      .addTextInput('statusText', {
        label: 'widgets.thingsvis-widget-industrial-status-panel.label_26',
        default: '正常',
      })
      .addSwitch('showLight', {
        label: 'widgets.thingsvis-widget-industrial-status-panel.label_27',
        default: true,
      });
  }, { 
    label: { zh: '指示器设置', en: 'Indicator Settings' },
    showWhen: { field: 'type', value: 'indicator' }
  })

  // ============================================
  // 样式配置组
  // ============================================
  .addGroup('Style', (builder) => {
    builder
      .addColorPicker('primaryColor', {
        label: 'widgets.thingsvis-widget-industrial-status-panel.label_28',
        default: '',
      })
      .addColorPicker('backgroundColor', {
        label: 'widgets.thingsvis-widget-industrial-status-panel.label_29',
        default: 'rgba(0,0,0,0.4)',
      })
      .addColorPicker('borderColor', {
        label: 'widgets.thingsvis-widget-industrial-status-panel.label_30',
        default: '',
      })
      .addSlider('borderRadius', {
        label: 'widgets.thingsvis-widget-industrial-status-panel.label_31',
        min: 0,
        max: 20,
        default: 4,
      })
      .addSlider('padding', {
        label: 'widgets.thingsvis-widget-industrial-status-panel.label_32',
        min: 0,
        max: 20,
        default: 10,
      })
      .addSlider('fontSize', {
        label: 'widgets.thingsvis-widget-industrial-status-panel.label_33',
        min: 10,
        max: 32,
        default: 14,
      });
  }, { label: { zh: '样式', en: 'Style' } })

  // ============================================
  // 布局配置组
  // ============================================
  .addGroup('Layout', (builder) => {
    builder
      .addSegmented('layout', {
        label: 'widgets.thingsvis-widget-industrial-status-panel.label_34',
        options: [
          { label: 'widgets.thingsvis-widget-industrial-status-panel.label_35', value: 'horizontal', icon: 'AlignHorizontalSpaceAround' },
          { label: 'widgets.thingsvis-widget-industrial-status-panel.label_36', value: 'vertical', icon: 'AlignVerticalSpaceAround' },
        ],
      })
      .addSegmented('align', {
        label: 'widgets.thingsvis-widget-industrial-status-panel.label_37',
        options: [
          { label: 'widgets.thingsvis-widget-industrial-status-panel.label_38', value: 'left', icon: 'AlignLeft' },
          { label: 'widgets.thingsvis-widget-industrial-status-panel.label_39', value: 'center', icon: 'AlignCenter' },
          { label: 'widgets.thingsvis-widget-industrial-status-panel.label_40', value: 'right', icon: 'AlignRight' },
        ],
      });
  }, { label: { zh: '布局', en: 'Layout' }, expanded: false })

  .build();
