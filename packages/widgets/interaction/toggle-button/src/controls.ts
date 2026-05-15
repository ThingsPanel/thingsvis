import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-interaction-toggle-button';

export const controls = createControlPanel()
  .addGroup('Content', (b) => {
    b.addSwitch('value', { label: `${W}.value`, binding: true });
    b.addTextInput('onLabel', { label: `${W}.onLabel`, binding: true });
    b.addTextInput('offLabel', { label: `${W}.offLabel`, binding: true });
    b.addSlider('fontSize', { label: `${W}.fontSize`, min: 10, max: 48, step: 1, default: 14 });
  }, { label: `${W}.groupContent` })
  .addGroup('Style', (b) => {
    b.addColorPicker('onColor', { label: `${W}.onColor`, binding: true, default: '' });
    b.addColorPicker('offColor', { label: `${W}.offColor`, binding: true, default: '' });
    b.addColorPicker('onTextColor', { label: `${W}.onTextColor`, binding: true });
    b.addColorPicker('offTextColor', { label: `${W}.offTextColor`, binding: true });
    b.addSlider('borderRadius', { label: `${W}.borderRadius`, min: 0, max: 50, step: 1, default: 6 });
    b.addSwitch('disabled', { label: `${W}.disabled` });
  }, { label: `${W}.groupStyle` })
  .addGroup('Behavior', (b) => {
    b.addSwitch('confirmToggle', { label: `${W}.confirmToggle` });
    b.addTextInput('confirmMessage', { label: `${W}.confirmMessage` });
  }, { label: `${W}.groupBehavior` })
  .build();
