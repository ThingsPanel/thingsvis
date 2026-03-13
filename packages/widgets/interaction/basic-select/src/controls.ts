import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-interaction-basic-select';

export const controls = createControlPanel()
  .addGroup('Content', (b) => {
    b.addTextInput('label', { label: `${W}.label`, binding: true });
    b.addTextInput('placeholder', { label: `${W}.placeholder` });
    b.addTextInput('options', { label: `${W}.options` });
    b.addSlider('fontSize', { label: `${W}.fontSize`, min: 10, max: 48, step: 1, default: 14 });
  }, { label: `${W}.groupContent` })
  .addGroup('Style', (b) => {
    b.addColorPicker('backgroundColor', { label: `${W}.backgroundColor`, binding: true });
    b.addColorPicker('textColor', { label: `${W}.textColor`, binding: true });
    b.addColorPicker('borderColor', { label: `${W}.borderColor`, binding: true });
    b.addSlider('borderRadius', { label: `${W}.borderRadius`, min: 0, max: 50, step: 1, default: 6 });
    b.addSwitch('disabled', { label: `${W}.disabled` });
  }, { label: `${W}.groupStyle` })
  .build();
