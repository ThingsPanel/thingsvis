import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-interaction-basic-input';

export const controls = createControlPanel()
  .addGroup(
    'Content',
    (builder) => {
      builder.addTextInput('label', { label: `${W}.label` });
      builder.addTextInput('placeholder', { label: `${W}.placeholder` });
      builder.addTextInput('value', { label: `${W}.value`, binding: true });
      builder.addSegmented('inputType', {
        label: `${W}.inputType`,
        options: [
          { label: { en: 'Text', zh: '文本' }, value: 'text' },
          { label: { en: 'Number', zh: '数字' }, value: 'number' },
          { label: { en: 'Password', zh: '密码' }, value: 'password' },
        ],
        default: 'text',
      });
      builder.addSegmented('submitOn', {
        label: `${W}.submitOn`,
        options: [
          { label: { en: 'Enter', zh: '回车' }, value: 'enter' },
          { label: { en: 'Blur', zh: '失焦' }, value: 'blur' },
          { label: { en: 'Both', zh: '两者' }, value: 'both' },
        ],
        default: 'both',
      });
      builder.addSwitch('disabled', { label: `${W}.disabled` });
    },
    { label: `${W}.groupContent` },
  )
  .addGroup(
    'Style',
    (builder) => {
      builder.addColorPicker('textColor', { label: `${W}.textColor` });
      builder.addColorPicker('accentColor', { label: `${W}.accentColor` });
      builder.addSlider('fontSize', { label: `${W}.fontSize`, min: 10, max: 48, step: 1, default: 14 });
      builder.addSlider('borderRadius', { label: `${W}.borderRadius`, min: 0, max: 24, step: 1, default: 6 });
    },
    { label: `${W}.groupStyle` },
  )
  .build();
