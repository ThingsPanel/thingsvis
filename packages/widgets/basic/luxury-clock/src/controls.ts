import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-basic-luxury-clock';

export const controls = createControlPanel()
  .addContentGroup((b) => {
    b.addSwitch('showSecondHand', { label: `${W}.showSecondHand` });
    b.addSwitch('showNumbers', { label: `${W}.showNumbers` });
    b.addSwitch('showTicks', { label: `${W}.showTicks` });
    b.addSwitch('smoothSweep', { label: `${W}.smoothSweep` });
    b.addSwitch('romanNumerals', { label: `${W}.romanNumerals` });
  })
  .addStyleGroup((b) => {
    b.addColorPicker('accentColor', { label: `${W}.accentColor`, default: '' });
  })
  .build();
