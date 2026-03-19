import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-interaction-basic-progress';

export const controls = createControlPanel()
  .addGroup('Data', (b) => {
    b.addSlider('value', { label: `${W}.value`, min: 0, max: 100, step: 1, default: 60, binding: true });
    b.addSlider('max', { label: `${W}.max`, min: 1, max: 1000, step: 1, default: 100 });
    b.addTextInput('label', { label: `${W}.label` });
    b.addTextInput('unit', { label: `${W}.unit` });
    b.addSwitch('showValue', { label: `${W}.showValue` });
    b.addSwitch('animated', { label: `${W}.animated` });
  }, { label: `${W}.groupData` })
  .addGroup('Style', (b) => {
    b.addSegmented('orientation', {
      label: `${W}.orientation`,
      options: [
        { label: { en: 'Horizontal', zh: '水平' }, value: 'horizontal' },
        { label: { en: 'Vertical', zh: '垂直' }, value: 'vertical' },
      ],
      default: 'horizontal',
    });
    b.addColorPicker('color', { label: `${W}.color` });
    b.addColorPicker('trackColor', { label: `${W}.trackColor` });
    b.addColorPicker('textColor', { label: `${W}.textColor` });
    b.addSlider('fontSize', { label: `${W}.fontSize`, min: 10, max: 32, step: 1, default: 13 });
    b.addSlider('borderRadius', { label: `${W}.borderRadius`, min: 0, max: 20, step: 1, default: 8 });
  }, { label: `${W}.groupStyle` })
  .build();
