import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-custom-digital-clock';

export const controls = createControlPanel()
  .addContentGroup((b) => {
    b.addSelect('hourCycle', {
      label: `${W}.hourCycle`,
      options: [
        { label: { zh: '24 小时', en: '24-hour' }, value: '24h' },
        { label: { zh: '12 小时', en: '12-hour' }, value: '12h' },
      ],
    });
    b.addSwitch('showSeconds', { label: `${W}.showSeconds` });
    b.addSwitch('showDate', { label: `${W}.showDate` });
    b.addSelect('layout', {
      label: `${W}.layout`,
      options: [
        { label: { zh: '竖排', en: 'Vertical' }, value: 'vertical' },
        { label: { zh: '横排', en: 'Horizontal' }, value: 'horizontal' },
      ],
    });
    b.addSelect('align', {
      label: `${W}.align`,
      options: [
        { label: { zh: '左对齐', en: 'Left' }, value: 'left' },
        { label: { zh: '居中', en: 'Center' }, value: 'center' },
        { label: { zh: '右对齐', en: 'Right' }, value: 'right' },
      ],
    });
  })
  .addStyleGroup((b) => {
    b.addSlider('timeFontSize', {
      label: `${W}.timeFontSize`,
      min: 18,
      max: 120,
      step: 1,
      default: 56,
    });
    b.addSlider('dateFontSize', {
      label: `${W}.dateFontSize`,
      min: 10,
      max: 48,
      step: 1,
      default: 22,
    });
    b.addColorPicker('timeColor', { label: `${W}.timeColor`, default: '' });
    b.addColorPicker('dateColor', { label: `${W}.dateColor`, default: '' });
  })
  .build();
