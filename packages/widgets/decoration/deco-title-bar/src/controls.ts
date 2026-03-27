import { createControlPanel } from '@thingsvis/widget-sdk';
const W = 'widgets.thingsvis-widget-decoration-deco-title-bar';

export const controls = createControlPanel()
  .addGroup('Style', (b) => {
    b.addColorPicker('color', { label: `${W}.color`, binding: true });
    b.addColorPicker('secondaryColor', { label: `${W}.secondaryColor`, binding: true });
    b.addSlider('opacity', { label: `${W}.opacity`, min: 0.1, max: 1, step: 0.1, default: 1 });
  }, { label: `${W}.groupStyle` })
  .addGroup('Animation', (b) => {
    b.addSwitch('animated', { label: `${W}.animated` });
    b.addSlider('animationSpeed', { label: `${W}.animationSpeed`, min: 0.5, max: 10, step: 0.5, default: 3 });
  }, { label: `${W}.groupAnimation` })
  .build();
