import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-decoration-tech-border';

export const controls = createControlPanel()
  .addContentGroup((builder) => {
    builder
      .addSwitch('useThemeColor', {
        label: `${W}.label_27`,
        default: true,
      })
      .addSelect('variant', {
        label: `${W}.label_1`,
        options: [
          { label: `${W}.label_2`, value: 'corner-cut' },
          { label: `${W}.label_3`, value: 'tech-lines' },
          { label: `${W}.label_4`, value: 'glow' },
          { label: `${W}.label_5`, value: 'simple' },
        ],
        default: 'corner-cut',
      })
      .addColorPicker('borderColor', {
        label: `${W}.label_6`,
        default: '#6965db',
      })
      .addSlider('borderWidth', {
        label: `${W}.label_7`,
        min: 1,
        max: 10,
        default: 2,
      })
      .addSlider('contentPadding', {
        label: `${W}.label_22`,
        min: 0,
        max: 40,
        default: 12,
      })
      .addColorPicker('backgroundColor', {
        label: `${W}.label_21`,
        default: 'transparent',
      });
  })
  .addGroup(
    'Glow',
    (builder) => {
      builder
        .addSwitch('glowEnabled', {
          label: `${W}.label_8`,
          default: true,
        })
        .addColorPicker('glowColor', {
          label: `${W}.label_9`,
          default: '',
          showWhen: { field: 'glowEnabled', value: true },
        })
        .addSlider('glowBlur', {
          label: `${W}.label_10`,
          min: 0,
          max: 50,
          default: 8,
          showWhen: { field: 'glowEnabled', value: true },
        })
        .addSlider('glowSpread', {
          label: `${W}.label_11`,
          min: 0,
          max: 20,
          default: 2,
          showWhen: { field: 'glowEnabled', value: true },
        });
    },
    { label: { zh: '发光效果', en: 'Glow Effect' } },
  )
  .addGroup(
    'Decoration',
    (builder) => {
      builder
        .addSlider('cornerSize', {
          label: `${W}.label_12`,
          min: 0,
          max: 50,
          default: 15,
        })
        .addSwitch('showCornerDecoration', {
          label: `${W}.label_13`,
          default: true,
        })
        .addSlider('decorationLength', {
          label: `${W}.label_14`,
          min: 5,
          max: 100,
          default: 30,
          showWhen: { field: 'showCornerDecoration', value: true },
        })
        .addSlider('decorationWidth', {
          label: `${W}.label_15`,
          min: 1,
          max: 10,
          default: 3,
          showWhen: { field: 'showCornerDecoration', value: true },
        });
    },
    { label: { zh: '装饰', en: 'Decoration' } },
  )
  .addGroup(
    'Animation',
    (builder) => {
      builder
        .addSwitch('animated', {
          label: `${W}.label_16`,
          default: false,
        })
        .addSlider('animationSpeed', {
          label: `${W}.label_17`,
          min: 0.5,
          max: 10,
          step: 0.5,
          default: 3,
          showWhen: { field: 'animated', value: true },
        })
        .addSegmented('animationDirection', {
          label: `${W}.label_18`,
          options: [
            { label: `${W}.label_19`, value: 'clockwise', icon: 'RotateCw' },
            { label: `${W}.label_20`, value: 'counter-clockwise', icon: 'RotateCcw' },
          ],
          showWhen: { field: 'animated', value: true },
        });
    },
    { label: { zh: '动画', en: 'Animation' }, expanded: false },
  )
  .addGroup(
    'Gradient',
    (builder) => {
      builder
        .addSwitch('gradientEnabled', {
          label: `${W}.label_23`,
          default: true,
        })
        .addColorPicker('gradientStart', {
          label: `${W}.label_24`,
          default: '#6965db',
          showWhen: { field: 'gradientEnabled', value: true },
        })
        .addColorPicker('gradientEnd', {
          label: `${W}.label_25`,
          default: '#6965db',
          showWhen: { field: 'gradientEnabled', value: true },
        })
        .addSlider('gradientAngle', {
          label: `${W}.label_26`,
          min: 0,
          max: 360,
          default: 45,
          showWhen: { field: 'gradientEnabled', value: true },
        });
    },
    { label: { zh: '渐变', en: 'Gradient' }, expanded: false },
  )
  .build();
