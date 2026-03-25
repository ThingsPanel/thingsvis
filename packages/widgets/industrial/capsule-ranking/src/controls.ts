/**
 * Capsule Ranking 组件控制面板配置
 */

import { createControlPanel } from '@thingsvis/widget-sdk';

export const controls = createControlPanel()
  // ============================================
  // 数据配置组
  // ============================================
  .addContentGroup((builder) => {
    builder
      .addTextInput('title', {
        label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_1',
        default: '排行榜',
      })
      .addJsonEditor('data', {
        label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_2',
        binding: true,
      });
  })

  // ============================================
  // 排序配置组
  // ============================================
  .addGroup('Sort', (builder) => {
    builder
      .addSelect('sortBy', {
        label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_3',
        options: [
          { label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_4', value: 'value' },
          { label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_5', value: 'name' },
          { label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_6', value: 'none' },
        ],
        default: 'value',
      })
      .addSegmented('sortOrder', {
        label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_7',
        options: [
          { label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_8', value: 'desc', icon: 'ArrowDown' },
          { label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_9', value: 'asc', icon: 'ArrowUp' },
        ],
      })
      .addNumberInput('maxValue', {
        label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_10',
        min: 0,
        default: 0,
        placeholder: 'Auto',
      });
  }, { label: { zh: '排序', en: 'Sort' } })

  // ============================================
  // 胶囊样式组
  // ============================================
  .addGroup('Capsule', (builder) => {
    builder
      .addSlider('capsuleHeight', {
        label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_11',
        min: 4,
        max: 40,
        default: 12,
      })
      .addSlider('capsuleRadius', {
        label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_12',
        min: 0,
        max: 20,
        default: 6,
      })
      .addSwitch('gradientEnabled', {
        label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_13',
        default: true,
      })
      .addColorPicker('trackColor', {
        label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_14',
        default: 'rgba(255,255,255,0.1)',
      });
  }, { label: { zh: '胶囊样式', en: 'Capsule Style' } })

  // ============================================
  // 显示配置组
  // ============================================
  .addGroup('Display', (builder) => {
    builder
      .addSwitch('showRank', {
        label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_15',
        default: true,
      })
      .addSwitch('showName', {
        label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_16',
        default: true,
      })
      .addSwitch('showValue', {
        label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_17',
        default: true,
      })
      .addSwitch('showUnit', {
        label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_18',
        default: true,
      })
      .addSlider('labelWidth', {
        label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_19',
        min: 40,
        max: 200,
        default: 80,
      });
  }, { label: { zh: '显示', en: 'Display' } })

  // ============================================
  // 排名颜色组
  // ============================================
  .addGroup('Rank Colors', (builder) => {
    builder
      .addColorPicker('top1Color', {
        label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_20',
        default: '#ff4d4f',
      })
      .addColorPicker('top2Color', {
        label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_21',
        default: '#faad14',
      })
      .addColorPicker('top3Color', {
        label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_22',
        default: '#52c41a',
      })
      .addColorPicker('otherRankColor', {
        label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_23',
        default: '',
      });
  }, { label: { zh: '排名颜色', en: 'Rank Colors' } })

  // ============================================
  // 布局配置组
  // ============================================
  .addGroup('Layout', (builder) => {
    builder
      .addSlider('rowHeight', {
        label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_24',
        min: 20,
        max: 80,
        default: 36,
      })
      .addSlider('rowGap', {
        label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_25',
        min: 0,
        max: 20,
        default: 8,
      })
      .addSlider('fontSize', {
        label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_26',
        min: 10,
        max: 24,
        default: 13,
      });
  }, { label: { zh: '布局', en: 'Layout' }, expanded: false })

  // ============================================
  // 动画配置组
  // ============================================
  .addGroup('Animation', (builder) => {
    builder
      .addSwitch('animated', {
        label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_27',
        default: true,
      })
      .addSlider('animationDuration', {
        label: 'widgets.thingsvis-widget-industrial-capsule-ranking.label_28',
        min: 0.3,
        max: 3,
        step: 0.1,
        default: 0.8,
        showWhen: { field: 'animated', value: true },
      });
  }, { label: { zh: '动画', en: 'Animation' }, expanded: false })

  .build();
