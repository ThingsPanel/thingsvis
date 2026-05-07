import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-basic-rich-text';

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
        .addCustom('body', 'textarea', {
          label: `${W}.body`,
          binding: true,
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
          max: 32,
          step: 1,
          default: 18,
          showWhen: { field: 'showTitle', value: true },
        })
        .addSlider('bodyFontSize', {
          label: `${W}.bodyFontSize`,
          min: 10,
          max: 24,
          step: 1,
          default: 14,
        })
        .addSlider('lineHeight', {
          label: `${W}.lineHeight`,
          min: 1,
          max: 2.4,
          step: 0.1,
          default: 1.6,
        })
        .addSegmented('align', {
          label: `${W}.align`,
          options: [
            { label: `${W}.alignLeft`, value: 'left', icon: 'AlignLeft' },
            { label: `${W}.alignCenter`, value: 'center', icon: 'AlignCenter' },
            { label: `${W}.alignRight`, value: 'right', icon: 'AlignRight' },
          ],
        });
    },
    { label: `${W}.groupTypography` },
  )
  .addGroup(
    'Style',
    (builder) => {
      builder
        .addColorPicker('titleColor', { label: `${W}.titleColor`, binding: true })
        .addColorPicker('bodyColor', { label: `${W}.bodyColor`, binding: true })
        .addColorPicker('backgroundColor', { label: `${W}.backgroundColor`, binding: true })
        .addSlider('backgroundOpacity', {
          label: `${W}.backgroundOpacity`,
          min: 0,
          max: 1,
          step: 0.01,
          default: 0.92,
        })
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
          max: 40,
          step: 1,
          default: 18,
        });
    },
    { label: `${W}.groupStyle` },
  )
  .build();
