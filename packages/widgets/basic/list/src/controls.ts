import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-basic-list';

export const controls = createControlPanel()
  .addGroup(
    'Content',
    (builder) => {
      builder
        .addSwitch('showTitle', { label: `${W}.showTitle` })
        .addTextInput('title', {
          label: `${W}.title`,
          binding: true,
          showWhen: { field: 'showTitle', value: true },
        })
        .addCustom('itemsText', 'textarea', {
          label: `${W}.itemsText`,
          binding: true,
        })
        .addSelect('bulletStyle', {
          label: `${W}.bulletStyle`,
          options: [
            { label: `${W}.bulletDot`, value: 'dot' },
            { label: `${W}.bulletCheck`, value: 'check' },
            { label: `${W}.bulletNumber`, value: 'number' },
          ],
        });
    },
    { label: `${W}.groupContent` },
  )
  .addGroup(
    'Typography',
    (builder) => {
      builder
        .addSlider('titleFontSize', {
          label: `${W}.titleFontSize`,
          min: 12,
          max: 28,
          step: 1,
          default: 16,
          showWhen: { field: 'showTitle', value: true },
        })
        .addSlider('fontSize', {
          label: `${W}.fontSize`,
          min: 10,
          max: 24,
          step: 1,
          default: 14,
        })
        .addSlider('rowGap', {
          label: `${W}.rowGap`,
          min: 4,
          max: 24,
          step: 1,
          default: 10,
        });
    },
    { label: `${W}.groupTypography` },
  )
  .addGroup(
    'Style',
    (builder) => {
      builder
        .addColorPicker('titleColor', { label: `${W}.titleColor`, binding: true })
        .addColorPicker('textColor', { label: `${W}.textColor`, binding: true })
        .addColorPicker('accentColor', { label: `${W}.accentColor`, binding: true })
        .addColorPicker('backgroundColor', { label: `${W}.backgroundColor`, binding: true })
        .addColorPicker('borderColor', { label: `${W}.borderColor`, binding: true })
        .addSlider('borderWidth', {
          label: `${W}.borderWidth`,
          min: 0,
          max: 8,
          step: 1,
          default: 1,
        })
        .addSlider('cornerRadius', {
          label: `${W}.cornerRadius`,
          min: 0,
          max: 32,
          step: 1,
          default: 12,
        })
        .addSlider('paddingSize', {
          label: `${W}.paddingSize`,
          min: 8,
          max: 32,
          step: 1,
          default: 16,
        });
    },
    { label: `${W}.groupStyle` },
  )
  .build();
