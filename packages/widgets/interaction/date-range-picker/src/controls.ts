import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-interaction-date-range-picker';

export const controls = createControlPanel()
  .addGroup('Content', (b) => {
    b.addTextInput('label', { label: `${W}.label` });
    b.addSwitch('showPresets', { label: `${W}.showPresets` });
  }, { label: `${W}.groupContent` })
  .addGroup('Style', (b) => {
    b.addColorPicker('textColor', { label: `${W}.textColor` });
    b.addColorPicker('accentColor', { label: `${W}.accentColor` });
    b.addSlider('fontSize', { label: `${W}.fontSize`, min: 10, max: 20, step: 1, default: 12 });
  }, { label: `${W}.groupStyle` })
  .build();
