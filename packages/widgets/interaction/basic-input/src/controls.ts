import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-interaction-basic-input';

export const controls = createControlPanel()
  .addGroup('Content', (b) => {
    b.addTextInput('label', { label: `${W}.label` });
    b.addTextInput('placeholder', { label: `${W}.placeholder` });
    b.addSegmented('inputType', {
      label: `${W}.inputType`,
      options: [
        { label: { en: 'Text', zh: '文本' }, value: 'text' },
        { label: { en: 'Number', zh: '数字' }, value: 'number' },
        { label: { en: 'Password', zh: '密码' }, value: 'password' },
      ],
      default: 'text',
    });
    b.addSegmented('submitOn', {
      label: `${W}.submitOn`,
      options: [
        { label: { en: 'Enter', zh: '回车' }, value: 'enter' },
        { label: { en: 'Blur', zh: '失焦' }, value: 'blur' },
        { label: { en: 'Both', zh: '两者' }, value: 'both' },
      ],
      default: 'both',
    });
    b.addSwitch('disabled', { label: `${W}.disabled` });
  }, { label: `${W}.groupContent` })
  .addGroup('Style', (b) => {
    b.addColorPicker('backgroundColor', { label: `${W}.backgroundColor` });
    b.addColorPicker('textColor', { label: `${W}.textColor` });
    b.addColorPicker('borderColor', { label: `${W}.borderColor` });
    b.addColorPicker('accentColor', { label: `${W}.accentColor` });
    b.addSlider('fontSize', { label: `${W}.fontSize`, min: 10, max: 48, step: 1, default: 14 });
    b.addSlider('borderRadius', { label: `${W}.borderRadius`, min: 0, max: 24, step: 1, default: 6 });
  }, { label: `${W}.groupStyle` })
  .build();
