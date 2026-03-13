import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-interaction-basic-switch';

export const controls = createControlPanel()
  .addGroup('Content', (b) => {
    b.addSwitch('value', { label: `${W}.value`, binding: true });
    b.addTextInput('label', { label: `${W}.label`, binding: true });
    b.addSwitch('showLabel', { label: `${W}.showLabel` });
    b.addSelect('labelPosition', { label: `${W}.labelPosition`, options: [
      { label: { en: 'Left', zh: '左侧' }, value: 'left' },
      { label: { en: 'Right', zh: '右侧' }, value: 'right' },
    ]});
    b.addTextInput('onLabel', { label: `${W}.onLabel` });
    b.addTextInput('offLabel', { label: `${W}.offLabel` });
  }, { label: `${W}.groupContent` })
  .addGroup('Style', (b) => {
    b.addSelect('size', { label: `${W}.size`, options: [
      { label: { en: 'Default', zh: '默认' }, value: 'default' },
      { label: { en: 'Small', zh: '小' }, value: 'small' },
    ]});
    b.addColorPicker('onColor', { label: `${W}.onColor`, binding: true });
    b.addColorPicker('offColor', { label: `${W}.offColor`, binding: true });
  }, { label: `${W}.groupStyle` })
  .addGroup('Behavior', (b) => {
    b.addSwitch('disabled', { label: `${W}.disabled` });
    b.addSwitch('confirmToggle', { label: `${W}.confirmToggle` });
    b.addTextInput('confirmMessage', { label: `${W}.confirmMessage` });
  }, { label: `${W}.groupBehavior` })
  .build();
