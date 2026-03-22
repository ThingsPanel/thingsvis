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
  })
  .build();
