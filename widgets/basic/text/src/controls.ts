/**
 * 属性面板控制配置
 * 
 * 使用 @thingsvis/widget-sdk 的 createControlPanel Builder API
 */

import { createControlPanel } from '@thingsvis/widget-sdk';

export const controls = createControlPanel()
  // ============================================
  // 内容分组
  // ============================================
  .addContentGroup((builder) => {
    builder.addCustom('text', 'textarea', {
      label: '文本内容',
      binding: true,
      placeholder: '请输入文本（支持换行）',
    });
  })

  // ============================================
  // 字体分组
  // ============================================
  .addGroup('Font', (builder) => {
    builder
      .addSlider('fontSize', {
        label: '字号',
        min: 8,
        max: 200,
        default: 16,
        binding: true,
      })
      .addSelect('fontFamily', {
        label: '字体',
        options: [
          { label: '无衬线', value: 'sans-serif' },
          { label: '衬线', value: 'serif' },
          { label: '等宽', value: 'monospace' },
          { label: 'Arial', value: 'Arial' },
          { label: 'Helvetica', value: 'Helvetica' },
          { label: 'Times New Roman', value: 'Times New Roman' },
          { label: 'Georgia', value: 'Georgia' },
          { label: 'Courier New', value: 'Courier New' },
          { label: '微软雅黑', value: 'Microsoft YaHei' },
          { label: '苹方', value: 'PingFang SC' },
          { label: '黑体', value: 'SimHei' },
          { label: '宋体', value: 'SimSun' },
        ],
      })
      .addSelect('fontWeight', {
        label: '字重',
        options: [
          { label: '正常', value: 'normal' },
          { label: '粗体', value: 'bold' },
          { label: '细体', value: 'lighter' },
          { label: '100', value: '100' },
          { label: '200', value: '200' },
          { label: '300', value: '300' },
          { label: '400', value: '400' },
          { label: '500', value: '500' },
          { label: '600', value: '600' },
          { label: '700', value: '700' },
          { label: '800', value: '800' },
          { label: '900', value: '900' },
        ],
      })
      .addSegmented('fontStyle', {
        label: '斜体',
        options: [
          { label: '正常', value: 'normal', icon: 'Type' },
          { label: '斜体', value: 'italic', icon: 'Italic' },
        ],
      });
  }, { label: '字体' })

  // ============================================
  // 排版分组
  // ============================================
  .addGroup('Layout', (builder) => {
    builder
      .addSegmented('textAlign', {
        label: '水平对齐',
        options: [
          { label: '左', value: 'left', icon: 'AlignLeft' },
          { label: '中', value: 'center', icon: 'AlignCenter' },
          { label: '右', value: 'right', icon: 'AlignRight' },
          { label: '两端', value: 'justify', icon: 'AlignJustify' },
        ],
      })
      .addSegmented('verticalAlign', {
        label: '垂直对齐',
        options: [
          { label: '上', value: 'top', icon: 'AlignStartVertical' },
          { label: '中', value: 'middle', icon: 'AlignCenterVertical' },
          { label: '下', value: 'bottom', icon: 'AlignEndVertical' },
        ],
      })
      .addSlider('lineHeight', {
        label: '行高',
        min: 0.5,
        max: 5,
        step: 0.1,
        default: 1.4,
      })
      .addSlider('letterSpacing', {
        label: '字间距',
        min: -10,
        max: 50,
        step: 0.5,
        default: 0,
      })
      .addSegmented('textDecoration', {
        label: '装饰线',
        options: [
          { label: '无', value: 'none', icon: 'RemoveFormatting' },
          { label: '下划线', value: 'underline', icon: 'Underline' },
          { label: '删除线', value: 'line-through', icon: 'Strikethrough' },
        ],
      });
  }, { label: '排版' })

  // ============================================
  // 颜色分组
  // ============================================
  .addStyleGroup((builder) => {
    builder
      .addColorPicker('fill', {
        label: '文字颜色',
        default: '#333333',
        binding: true,
      })
      .addColorPicker('backgroundColor', {
        label: '背景颜色',
        default: 'transparent',
      })
      .addSlider('opacity', {
        label: '不透明度',
        min: 0,
        max: 1,
        step: 0.01,
        default: 1,
        binding: true,
      });
  })

  // ============================================
  // 阴影分组
  // ============================================
  .addGroup('Shadow', (builder) => {
    builder
      .addSwitch('textShadowEnabled', {
        label: '启用阴影',
        default: false,
      })
      .addColorPicker('textShadowColor', {
        label: '阴影颜色',
        default: 'rgba(0,0,0,0.3)',
        showWhen: { field: 'textShadowEnabled', value: true },
      })
      .addSlider('textShadowBlur', {
        label: '模糊半径',
        min: 0,
        max: 50,
        default: 4,
        showWhen: { field: 'textShadowEnabled', value: true },
      })
      .addNumberInput('textShadowOffsetX', {
        label: 'X 偏移',
        min: -50,
        max: 50,
        default: 1,
        showWhen: { field: 'textShadowEnabled', value: true },
      })
      .addNumberInput('textShadowOffsetY', {
        label: 'Y 偏移',
        min: -50,
        max: 50,
        default: 1,
        showWhen: { field: 'textShadowEnabled', value: true },
      });
  }, { label: '阴影', expanded: false })

  // ============================================
  // 高级分组
  // ============================================
  .addAdvancedGroup((builder) => {
    builder
      .addSlider('padding', {
        label: '内边距',
        min: 0,
        max: 100,
        default: 0,
      });
  })

  .build();
