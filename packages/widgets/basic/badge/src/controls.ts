import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-basic-badge';

export const controls = createControlPanel()
  .addGroup(
    'Content',
    (builder) => {
      builder
        .addTextInput('text', { label: `${W}.text`, binding: true })
        .addSelect('tone', {
          label: `${W}.tone`,
          options: [
            { label: `${W}.toneDefault`, value: 'default' },
            { label: `${W}.toneSuccess`, value: 'success' },
            { label: `${W}.toneWarning`, value: 'warning' },
            { label: `${W}.toneDanger`, value: 'danger' },
            { label: `${W}.toneInfo`, value: 'info' },
          ],
        })
        .addSelect('shape', {
          label: `${W}.shape`,
          options: [
            { label: `${W}.shapePill`, value: 'pill' },
            { label: `${W}.shapeRounded`, value: 'rounded' },
            { label: `${W}.shapeSquare`, value: 'square' },
          ],
        });
    },
    { label: `${W}.groupContent` },
  )
  .addGroup(
    'Style',
    (builder) => {
      builder
        .addSlider('fontSize', {
          label: `${W}.fontSize`,
          min: 10,
          max: 24,
          step: 1,
          default: 14,
        })
        .addSelect('fontWeight', {
          label: `${W}.fontWeight`,
          options: [
            { label: '400', value: '400' },
            { label: '500', value: '500' },
            { label: '600', value: '600' },
            { label: '700', value: '700' },
          ],
        })
        .addSlider('paddingX', {
          label: `${W}.paddingX`,
          min: 8,
          max: 32,
          step: 1,
          default: 14,
        })
        .addSlider('borderWidth', {
          label: `${W}.borderWidth`,
          min: 0,
          max: 6,
          step: 1,
          default: 1,
        })
        .addColorPicker('backgroundColor', { label: `${W}.backgroundColor`, binding: true })
        .addColorPicker('textColor', { label: `${W}.textColor`, binding: true })
        .addColorPicker('borderColor', { label: `${W}.borderColor`, binding: true })
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
