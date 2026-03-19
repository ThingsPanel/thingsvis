import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-interaction-basic-button';

export const controls = createControlPanel()
  .addGroup('Content', (b) => {
    b.addTextInput('label', { label: `${W}.label`, binding: true });
    b.addSlider('fontSize', { label: `${W}.fontSize`, min: 10, max: 48, step: 1, default: 14 });
  }, { label: `${W}.groupContent` })
  .addGroup('Style', (b) => {
    b.addSegmented('variant', {
      label: `${W}.variant`,
      options: [
        { label: { en: 'Filled', zh: '填充' }, value: 'filled' },
        { label: { en: 'Outline', zh: '描边' }, value: 'outline' },
        { label: { en: 'Ghost', zh: '幽灵' }, value: 'ghost' },
      ],
      default: 'filled',
    });
    b.addColorPicker('textColor', { label: `${W}.textColor`, binding: true });
    b.addSlider('borderRadius', { label: `${W}.borderRadius`, min: 0, max: 50, step: 1, default: 6 });
    b.addSwitch('disabled', { label: `${W}.disabled` });
  }, { label: `${W}.groupStyle` })
  .build();
