import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-basic-placeholder';

export const controls = createControlPanel()
  .addGroup(
    'Content',
    (builder) => {
      builder
        .addTextInput('title', { label: `${W}.title`, binding: true })
        .addCustom('description', 'textarea', { label: `${W}.description`, binding: true })
        .addSelect('icon', {
          label: `${W}.icon`,
          options: [
            { label: `${W}.iconFrame`, value: 'frame' },
            { label: `${W}.iconImage`, value: 'image' },
            { label: `${W}.iconChart`, value: 'chart' },
          ],
        });
    },
    { label: `${W}.groupContent` },
  )
  .addGroup(
    'Style',
    (builder) => {
      builder
        .addSelect('borderStyle', {
          label: `${W}.borderStyle`,
          options: [
            { label: `${W}.borderDashed`, value: 'dashed' },
            { label: `${W}.borderSolid`, value: 'solid' },
          ],
        })
        .addSlider('titleFontSize', {
          label: `${W}.titleFontSize`,
          min: 12,
          max: 28,
          step: 1,
          default: 16,
        })
        .addSlider('bodyFontSize', {
          label: `${W}.bodyFontSize`,
          min: 10,
          max: 20,
          step: 1,
          default: 12,
        })
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
          default: 14,
        })
        .addSlider('opacity', {
          label: `${W}.opacity`,
          min: 0,
          max: 1,
          step: 0.01,
          default: 1,
        });
    },
    { label: `${W}.groupStyle` },
  )
  .build();
