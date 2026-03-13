/**
 * 属性面板控制配置
 *
 * 使用 @thingsvis/widget-sdk 的 createControlPanel Builder API
 * NOTE: backgroundColor / opacity / padding 已迁移至画布引擎的 BaseStylePanel 统一管理
 */

import { createControlPanel } from '@thingsvis/widget-sdk';

export const controls = createControlPanel()
  // ============================================
  // 内容分组
  // ============================================
  .addContentGroup((builder) => {
    builder.addCustom('text', 'textarea', {
      label: 'widgets.thingsvis-widget-basic-text.label_1',
      binding: true,
      placeholder: 'widgets.thingsvis-widget-basic-text.label_59',
    });
  })

  // ============================================
  // 字体分组
  // ============================================
  .addGroup('Font', (builder) => {
    builder
      .addSlider('fontSize', {
        label: 'widgets.thingsvis-widget-basic-text.label_2',
        min: 8,
        max: 200,
        default: 16,
        binding: true,
      })
      .addSelect('fontFamily', {
        label: 'widgets.thingsvis-widget-basic-text.label_3',
        options: [
          { label: 'widgets.thingsvis-widget-basic-text.label_4', value: 'sans-serif' },
          { label: 'widgets.thingsvis-widget-basic-text.label_5', value: 'serif' },
          { label: 'widgets.thingsvis-widget-basic-text.label_6', value: 'monospace' },
          { label: 'widgets.thingsvis-widget-basic-text.label_7', value: 'Arial' },
          { label: 'widgets.thingsvis-widget-basic-text.label_8', value: 'Helvetica' },
          { label: 'widgets.thingsvis-widget-basic-text.label_9', value: 'Times New Roman' },
          { label: 'widgets.thingsvis-widget-basic-text.label_10', value: 'Georgia' },
          { label: 'widgets.thingsvis-widget-basic-text.label_11', value: 'Courier New' },
          { label: 'widgets.thingsvis-widget-basic-text.label_12', value: 'Microsoft YaHei' },
          { label: 'widgets.thingsvis-widget-basic-text.label_13', value: 'PingFang SC' },
          { label: 'widgets.thingsvis-widget-basic-text.label_14', value: 'SimHei' },
          { label: 'widgets.thingsvis-widget-basic-text.label_15', value: 'SimSun' },
        ],
      })
      .addSelect('fontWeight', {
        label: 'widgets.thingsvis-widget-basic-text.label_16',
        options: [
          { label: 'widgets.thingsvis-widget-basic-text.label_17', value: 'normal' },
          { label: 'widgets.thingsvis-widget-basic-text.label_18', value: 'bold' },
          { label: 'widgets.thingsvis-widget-basic-text.label_19', value: 'lighter' },
          { label: 'widgets.thingsvis-widget-basic-text.label_20', value: '100' },
          { label: 'widgets.thingsvis-widget-basic-text.label_21', value: '200' },
          { label: 'widgets.thingsvis-widget-basic-text.label_22', value: '300' },
          { label: 'widgets.thingsvis-widget-basic-text.label_23', value: '400' },
          { label: 'widgets.thingsvis-widget-basic-text.label_24', value: '500' },
          { label: 'widgets.thingsvis-widget-basic-text.label_25', value: '600' },
          { label: 'widgets.thingsvis-widget-basic-text.label_26', value: '700' },
          { label: 'widgets.thingsvis-widget-basic-text.label_27', value: '800' },
          { label: 'widgets.thingsvis-widget-basic-text.label_28', value: '900' },
        ],
      })
      .addSegmented('fontStyle', {
        label: 'widgets.thingsvis-widget-basic-text.label_29',
        options: [
          { label: 'widgets.thingsvis-widget-basic-text.label_30', value: 'normal', icon: 'Type' },
          { label: 'widgets.thingsvis-widget-basic-text.label_31', value: 'italic', icon: 'Italic' },
        ],
      });
  }, { label: { zh: '字体', en: 'Font' } })

  // ============================================
  // 排版分组
  // ============================================
  .addGroup('Layout', (builder) => {
    builder
      .addSegmented('textAlign', {
        label: 'widgets.thingsvis-widget-basic-text.label_33',
        options: [
          { label: 'widgets.thingsvis-widget-basic-text.label_34', value: 'left', icon: 'AlignLeft' },
          { label: 'widgets.thingsvis-widget-basic-text.label_35', value: 'center', icon: 'AlignCenter' },
          { label: 'widgets.thingsvis-widget-basic-text.label_36', value: 'right', icon: 'AlignRight' },
          { label: 'widgets.thingsvis-widget-basic-text.label_37', value: 'justify', icon: 'AlignJustify' },
        ],
      })
      .addSegmented('verticalAlign', {
        label: 'widgets.thingsvis-widget-basic-text.label_38',
        options: [
          { label: 'widgets.thingsvis-widget-basic-text.label_39', value: 'top', icon: 'AlignStartVertical' },
          { label: 'widgets.thingsvis-widget-basic-text.label_40', value: 'middle', icon: 'AlignCenterVertical' },
          { label: 'widgets.thingsvis-widget-basic-text.label_41', value: 'bottom', icon: 'AlignEndVertical' },
        ],
      })
      .addSlider('lineHeight', {
        label: 'widgets.thingsvis-widget-basic-text.label_42',
        min: 0.5,
        max: 5,
        step: 0.1,
        default: 1.4,
      })
      .addSlider('letterSpacing', {
        label: 'widgets.thingsvis-widget-basic-text.label_43',
        min: -10,
        max: 50,
        step: 0.5,
        default: 0,
      })
      .addSegmented('textDecoration', {
        label: 'widgets.thingsvis-widget-basic-text.label_44',
        options: [
          { label: 'widgets.thingsvis-widget-basic-text.label_45', value: 'none', icon: 'RemoveFormatting' },
          { label: 'widgets.thingsvis-widget-basic-text.label_46', value: 'underline', icon: 'Underline' },
          { label: 'widgets.thingsvis-widget-basic-text.label_47', value: 'line-through', icon: 'Strikethrough' },
        ],
      });
  }, { label: { zh: '排版', en: 'Layout' } })

  // ============================================
  // 颜色分组 — 只保留文字色（背景/透明度由 BaseStylePanel 管理）
  // ============================================
  .addStyleGroup((builder) => {
    builder
      .addColorPicker('fill', {
        label: 'widgets.thingsvis-widget-basic-text.label_49',
        default: '#333333',
        binding: true,
      });
  })

  // ============================================
  // 阴影分组
  // ============================================
  .addGroup('Shadow', (builder) => {
    builder
      .addSwitch('textShadowEnabled', {
        label: 'widgets.thingsvis-widget-basic-text.label_52',
        default: false,
      })
      .addColorPicker('textShadowColor', {
        label: 'widgets.thingsvis-widget-basic-text.label_53',
        default: 'rgba(0,0,0,0.3)',
        showWhen: { field: 'textShadowEnabled', value: true },
      })
      .addSlider('textShadowBlur', {
        label: 'widgets.thingsvis-widget-basic-text.label_54',
        min: 0,
        max: 50,
        default: 4,
        showWhen: { field: 'textShadowEnabled', value: true },
      })
      .addNumberInput('textShadowOffsetX', {
        label: 'widgets.thingsvis-widget-basic-text.label_55',
        min: -50,
        max: 50,
        default: 1,
        showWhen: { field: 'textShadowEnabled', value: true },
      })
      .addNumberInput('textShadowOffsetY', {
        label: 'widgets.thingsvis-widget-basic-text.label_56',
        min: -50,
        max: 50,
        default: 1,
        showWhen: { field: 'textShadowEnabled', value: true },
      });
  }, { label: { zh: '阴影', en: 'Shadow' }, expanded: false })

  .build();
