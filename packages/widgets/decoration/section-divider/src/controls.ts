import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-decoration-divider';

export const controls = createControlPanel()
  .addContentGroup((builder) => {
    builder
      .addSwitch('useThemeColor', {
        label: `${W}.label_1`,
        default: true,
      })
      .addSelect('variant', {
        label: `${W}.label_2`,
        options: [
          { label: `${W}.label_3`, value: 'scan-line' },
          { label: `${W}.label_4`, value: 'slide-bar' },
          { label: `${W}.label_5`, value: 'hex-chain' },
          { label: `${W}.label_6`, value: 'signal-wave' },
          { label: `${W}.label_13`, value: 'dot-chain' },
          { label: `${W}.label_14`, value: 'bracket-ends' },
          { label: `${W}.label_16`, value: 'diamond-trail' },
        ],
        default: 'dot-chain',
      })
      .addColorPicker('primaryColor', {
        label: `${W}.label_7`,
        default: '#00c2ff',
        showWhen: { field: 'useThemeColor', value: false },
      })
      .addColorPicker('secondaryColor', {
        label: `${W}.label_8`,
        default: '#00d4ff',
        showWhen: { field: 'useThemeColor', value: false },
      });
  })
  .addGroup(
    'Animation',
    (builder) => {
      builder
        .addSwitch('animated', {
          label: `${W}.label_11`,
          default: true,
        })
        .addSlider('animationSpeed', {
          label: `${W}.label_12`,
          min: 0.5,
          max: 10,
          step: 0.5,
          default: 3,
          showWhen: { field: 'animated', value: true },
        });
    },
    { label: { zh: '动画', en: 'Animation' }, expanded: false },
  )
  .build();
