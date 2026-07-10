import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-basic-card';

export const controls = createControlPanel()
  .addGroup(
    'Content',
    (builder) => {
      builder
        .addTextInput('title', { label: `${W}.title`, binding: true })
        .addSwitch('showSubtitle', { label: `${W}.showSubtitle` })
        .addTextInput('subtitle', {
          label: `${W}.subtitle`,
          binding: true,
          showWhen: { field: 'showSubtitle', value: true },
        })
        .addCustom('body', 'textarea', {
          label: `${W}.body`,
          binding: true,
        });
    },
    { label: `${W}.groupContent` },
  )
  .addGroup(
    'Style',
    (builder) => {
      builder
        .addColorPicker('fillColor', { label: `${W}.fillColor`, binding: true })
        .addSlider('fillOpacity', {
          label: `${W}.fillOpacity`,
          min: 0,
          max: 1,
          step: 0.01,
          default: 0.1,
        })
        .addColorPicker('borderColor', { label: `${W}.borderColor`, binding: true })
        .addSlider('borderWidth', {
          label: `${W}.borderWidth`,
          min: 0,
          max: 12,
          step: 1,
          default: 1,
        })
        .addSlider('cornerRadius', {
          label: `${W}.cornerRadius`,
          min: 0,
          max: 32,
          step: 1,
          default: 0,
        })
        .addSlider('paddingSize', {
          label: `${W}.paddingSize`,
          min: 8,
          max: 40,
          step: 1,
          default: 16,
        });
    },
    { label: `${W}.groupStyle` },
  )
  .addGroup(
    'Typography',
    (builder) => {
      builder
        .addSlider('titleFontSize', {
          label: `${W}.titleFontSize`,
          min: 10,
          max: 100,
          step: 1,
          default: 16,
        })
        .addColorPicker('titleColor', { label: `${W}.titleColor`, binding: true })
        .addColorPicker('subtitleColor', { label: `${W}.subtitleColor`, binding: true })
        .addColorPicker('bodyColor', { label: `${W}.bodyColor`, binding: true });
    },
    { label: `${W}.groupTypography`, expanded: false },
  )
  .addGroup(
    'Shadow',
    (builder) => {
      builder
        .addSwitch('shadowEnabled', { label: `${W}.shadowEnabled` })
        .addColorPicker('shadowColor', {
          label: `${W}.shadowColor`,
          showWhen: { field: 'shadowEnabled', value: true },
        })
        .addSlider('shadowBlur', {
          label: `${W}.shadowBlur`,
          min: 0,
          max: 80,
          step: 1,
          default: 20,
          showWhen: { field: 'shadowEnabled', value: true },
        })
        .addSlider('shadowOffsetY', {
          label: `${W}.shadowOffsetY`,
          min: -40,
          max: 40,
          step: 1,
          default: 10,
          showWhen: { field: 'shadowEnabled', value: true },
        });
    },
    { label: `${W}.groupShadow`, expanded: false },
  )
  .build();
