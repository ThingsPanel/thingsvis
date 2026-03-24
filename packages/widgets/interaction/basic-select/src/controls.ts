import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-interaction-basic-select';

export const controls = createControlPanel()
  .addGroup(
    'Content',
    (builder) => {
      builder.addTextInput('label', { label: `${W}.label`, binding: true });
      builder.addTextInput('placeholder', { label: `${W}.placeholder` });
      builder.addTextInput('options', { label: `${W}.options` });
      builder.addSlider('fontSize', { label: `${W}.fontSize`, min: 10, max: 48, step: 1, default: 14 });
    },
    { label: `${W}.groupContent` },
  )
  .addGroup(
    'Style',
    (builder) => {
      builder.addColorPicker('textColor', { label: `${W}.textColor`, binding: true });
      builder.addSlider('borderRadius', { label: `${W}.borderRadius`, min: 0, max: 50, step: 1, default: 6 });
      builder.addSwitch('disabled', { label: `${W}.disabled` });
    },
    { label: `${W}.groupStyle` },
  )
  .build();
