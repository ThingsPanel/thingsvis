import { createControlPanel } from '@thingsvis/widget-sdk';
import { VARIANT_DEFS } from './registry';

const W = 'widgets.thingsvis-widget-decoration-title';

const allVariants = VARIANT_DEFS.map(v => ({
  label: `${W}.variant.${v.id}`,
  value: v.id,
}));

export const controls = createControlPanel()
  .addContentGroup((builder) => {
    builder
      .addSwitch('useThemeColor', {
        label: `${W}.label_15`,
        default: true,
      })
      .addColorPicker('primaryColor', {
        label: `${W}.label_5`,
        default: '#00c2ff',
        showWhen: { field: 'useThemeColor', value: false },
      })
      .addColorPicker('secondaryColor', {
        label: `${W}.label_6`,
        default: '#00d4ff',
        showWhen: { field: 'useThemeColor', value: false },
      })
      .addColorPicker('glowColor', {
        label: `${W}.label_7`,
        default: '#00c2ff',
        showWhen: { field: 'useThemeColor', value: false },
      });
  })
  .addGroup(
    'Decoration',
    (builder) => {
      builder
        .addSelect('variant', {
          label: `${W}.label_4`,
          options: allVariants,
          default: 'glow-beam',
        })
        .addTextInput('title', {
          label: `${W}.label_13`,
          default: '',
          placeholder: `${W}.placeholder_1`,
        })
        .addSwitch('animated', {
          label: `${W}.label_10`,
          default: false,
        })
        .addSlider('animationSpeed', {
          label: `${W}.label_11`,
          min: 0.5,
          max: 10,
          step: 0.5,
          default: 3,
          showWhen: { field: 'animated', value: true },
        })
        .addSwitch('showDecoration', {
          label: `${W}.label_12`,
          default: true,
        });
    },
    { label: { zh: '装饰', en: 'Decoration' }, expanded: true },
  )
  .build();
