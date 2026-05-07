import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-basic-container';

export const controls = createControlPanel()
  .addGroup(
    'Content',
    (builder) => {
      builder.addSwitch('showTitle', { label: `${W}.showTitle` });
      builder.addTextInput('title', {
        label: `${W}.title`,
        binding: true,
        showWhen: { field: 'showTitle', value: true },
      });
    },
    { label: `${W}.groupContent` },
  )
  .addGroup(
    'Style',
    (builder) => {
      builder
        .addColorPicker('fillColor', { label: `${W}.fillColor`, binding: true })
        .addSlider('containerOpacity', {
          label: `${W}.containerOpacity`,
          min: 0,
          max: 1,
          step: 0.01,
          default: 0.06,
        })
        .addColorPicker('containerBorderColor', {
          label: `${W}.containerBorderColor`,
          binding: true,
        })
        .addSlider('containerBorderWidth', {
          label: `${W}.containerBorderWidth`,
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
          default: 8,
        })
        .addSlider('contentPadding', {
          label: `${W}.contentPadding`,
          min: 0,
          max: 64,
          step: 1,
          default: 12,
        });
    },
    { label: `${W}.groupStyle` },
  )
  .addGroup(
    'Title',
    (builder) => {
      builder
        .addSlider('titleHeight', {
          label: `${W}.titleHeight`,
          min: 24,
          max: 80,
          step: 1,
          default: 36,
          showWhen: { field: 'showTitle', value: true },
        })
        .addSlider('titleFontSize', {
          label: `${W}.titleFontSize`,
          min: 10,
          max: 32,
          step: 1,
          default: 14,
          showWhen: { field: 'showTitle', value: true },
        })
        .addColorPicker('titleColor', {
          label: `${W}.titleColor`,
          binding: true,
          showWhen: { field: 'showTitle', value: true },
        })
        .addColorPicker('titleBackgroundColor', {
          label: `${W}.titleBackgroundColor`,
          binding: true,
          showWhen: { field: 'showTitle', value: true },
        });
    },
    { label: `${W}.groupTitle`, expanded: false },
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
          default: 18,
          showWhen: { field: 'shadowEnabled', value: true },
        })
        .addSlider('shadowOffsetY', {
          label: `${W}.shadowOffsetY`,
          min: -40,
          max: 40,
          step: 1,
          default: 8,
          showWhen: { field: 'shadowEnabled', value: true },
        });
    },
    { label: `${W}.groupShadow`, expanded: false },
  )
  .build();
