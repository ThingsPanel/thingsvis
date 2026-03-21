import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-custom-analog-clock';

export const controls = createControlPanel()
  .addContentGroup((b) => {
    b.addSwitch('showSecondHand', { label: `${W}.showSecondHand` });
    b.addSwitch('showNumbers', { label: `${W}.showNumbers` });
  })
  .addStyleGroup((b) => {
    b.addSlider('bezelWidth', {
      label: `${W}.bezelWidth`,
      min: 4,
      max: 24,
      step: 1,
      default: 10,
    });
    b.addColorPicker('dialColor', { label: `${W}.dialColor`, default: '' });
    b.addColorPicker('bezelColor', { label: `${W}.bezelColor`, default: '' });
    b.addColorPicker('numberColor', { label: `${W}.numberColor`, default: '' });
    b.addColorPicker('hourHandColor', { label: `${W}.hourHandColor`, default: '' });
    b.addColorPicker('minuteHandColor', { label: `${W}.minuteHandColor`, default: '' });
    b.addColorPicker('secondHandColor', { label: `${W}.secondHandColor`, default: '' });
    b.addColorPicker('centerColor', { label: `${W}.centerColor`, default: '' });
    b.addColorPicker('centerBorderColor', { label: `${W}.centerBorderColor`, default: '' });
  })
  .build();
