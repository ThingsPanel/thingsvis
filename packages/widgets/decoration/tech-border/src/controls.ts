/**
 * Tech Border 组件控制面板配置
 */

import { createControlPanel } from '@thingsvis/widget-sdk';

export const controls = createControlPanel()
  // ============================================
  // 基础配置组
  // ============================================
  .addContentGroup((builder) => {
    builder
      .addSelect('variant', {
        label: 'widgets.thingsvis-widget-decoration-tech-border.label_1',
        options: [
          { label: 'widgets.thingsvis-widget-decoration-tech-border.label_2', value: 'corner-cut' },
          { label: 'widgets.thingsvis-widget-decoration-tech-border.label_3', value: 'tech-lines' },
          { label: 'widgets.thingsvis-widget-decoration-tech-border.label_4', value: 'glow' },
          { label: 'widgets.thingsvis-widget-decoration-tech-border.label_5', value: 'simple' },
        ],
        default: 'corner-cut',
      })
      .addColorPicker('borderColor', {
        label: 'widgets.thingsvis-widget-decoration-tech-border.label_6',
        default: '#0ea5e9',
      })
      .addSlider('borderWidth', {
        label: 'widgets.thingsvis-widget-decoration-tech-border.label_7',
        min: 1,
        max: 10,
        default: 2,
      });
  })

  // ============================================
  // 发光效果组
  // ============================================
  .addGroup('Glow', (builder) => {
    builder
      .addSwitch('glowEnabled', {
        label: 'widgets.thingsvis-widget-decoration-tech-border.label_8',
        default: true,
      })
      .addColorPicker('glowColor', {
        label: 'widgets.thingsvis-widget-decoration-tech-border.label_9',
        default: '',
        showWhen: { field: 'glowEnabled', value: true },
      })
      .addSlider('glowBlur', {
        label: 'widgets.thingsvis-widget-decoration-tech-border.label_10',
        min: 0,
        max: 50,
        default: 8,
        showWhen: { field: 'glowEnabled', value: true },
      })
      .addSlider('glowSpread', {
        label: 'widgets.thingsvis-widget-decoration-tech-border.label_11',
        min: 0,
        max: 20,
        default: 2,
        showWhen: { field: 'glowEnabled', value: true },
      });
  }, { label: { zh: '发光效果', en: 'Glow Effect' } })

  // ============================================
  // 装饰配置组
  // ============================================
  .addGroup('Decoration', (builder) => {
    builder
      .addSlider('cornerSize', {
        label: 'widgets.thingsvis-widget-decoration-tech-border.label_12',
        min: 0,
        max: 50,
        default: 15,
      })
      .addSwitch('showCornerDecoration', {
        label: 'widgets.thingsvis-widget-decoration-tech-border.label_13',
        default: true,
      })
      .addSlider('decorationLength', {
        label: 'widgets.thingsvis-widget-decoration-tech-border.label_14',
        min: 5,
        max: 100,
        default: 30,
        showWhen: { field: 'showCornerDecoration', value: true },
      })
      .addSlider('decorationWidth', {
        label: 'widgets.thingsvis-widget-decoration-tech-border.label_15',
        min: 1,
        max: 10,
        default: 3,
        showWhen: { field: 'showCornerDecoration', value: true },
      });
  }, { label: { zh: '装饰', en: 'Decoration' } })

  // ============================================
  // 动画配置组
  // ============================================
  .addGroup('Animation', (builder) => {
    builder
      .addSwitch('animated', {
        label: 'widgets.thingsvis-widget-decoration-tech-border.label_16',
        default: false,
      })
      .addSlider('animationSpeed', {
        label: 'widgets.thingsvis-widget-decoration-tech-border.label_17',
        min: 0.5,
        max: 10,
        step: 0.5,
        default: 3,
        showWhen: { field: 'animated', value: true },
      })
      .addSegmented('animationDirection', {
        label: 'widgets.thingsvis-widget-decoration-tech-border.label_18',
        options: [
          { label: 'widgets.thingsvis-widget-decoration-tech-border.label_19', value: 'clockwise', icon: 'RotateCw' },
          { label: 'widgets.thingsvis-widget-decoration-tech-border.label_20', value: 'counter-clockwise', icon: 'RotateCcw' },
        ],
        showWhen: { field: 'animated', value: true },
      });
  }, { label: { zh: '动画', en: 'Animation' }, expanded: false })

  // ============================================
  // 渐变配置组
  // ============================================
  .addGroup('Gradient', (builder) => {
    builder
      .addSwitch('gradientEnabled', {
        label: 'widgets.thingsvis-widget-decoration-tech-border.label_23',
        default: true,
      })
      .addColorPicker('gradientStart', {
        label: 'widgets.thingsvis-widget-decoration-tech-border.label_24',
        default: '#0ea5e9',
        showWhen: { field: 'gradientEnabled', value: true },
      })
      .addColorPicker('gradientEnd', {
        label: 'widgets.thingsvis-widget-decoration-tech-border.label_25',
        default: '#06b6d4',
        showWhen: { field: 'gradientEnabled', value: true },
      })
      .addSlider('gradientAngle', {
        label: 'widgets.thingsvis-widget-decoration-tech-border.label_26',
        min: 0,
        max: 360,
        default: 45,
        showWhen: { field: 'gradientEnabled', value: true },
      });
  }, { label: { zh: '渐变', en: 'Gradient' }, expanded: false })

  .build();
