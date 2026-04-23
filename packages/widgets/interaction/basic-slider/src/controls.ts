import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-interaction-basic-slider';

export const controls = createControlPanel()
  .addGroup('Content', (b) => {
    b.addTextInput('label', { label: `${W}.label`, binding: true });
    b.addSlider('value', {
      label: `${W}.value`,
      min: 0,
      max: 100,
      step: 1,
      default: 50,
      binding: true,
    });
    b.addNumberInput('min', { label: `${W}.min`, default: 0 });
    b.addNumberInput('max', { label: `${W}.max`, default: 100 });
    b.addNumberInput('step', { label: `${W}.step`, default: 1 });
    b.addTextInput('unit', { label: `${W}.unit`, binding: true });
    b.addSwitch('showValue', { label: `${W}.showValue` });
  }, { label: `${W}.groupContent` })
  .addGroup('Style', (b) => {
    b.addColorPicker('trackColor', { label: `${W}.trackColor`, binding: true });
    b.addColorPicker('textColor', { label: `${W}.textColor`, binding: true });
    b.addSwitch('disabled', { label: `${W}.disabled` });
  }, { label: `${W}.groupStyle` })
  .build();
