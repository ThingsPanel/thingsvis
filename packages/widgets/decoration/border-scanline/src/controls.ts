import { createControlPanel } from '@thingsvis/widget-sdk';
const W = 'widgets.thingsvis-widget-decoration-border-scanline';

export const controls = createControlPanel()
  .addGroup('Color', (b) => {
    b.addSwitch('useThemeColor', { label: `${W}.useThemeColor`, default: true });
    b.addColorPicker('color', { label: `${W}.color`, binding: true });
    b.addColorPicker('secondaryColor', { label: `${W}.secondaryColor`, binding: true });
    b.addColorPicker('glowColor', { label: `${W}.glowColor`, binding: true });
  }, { label: `${W}.groupColor` })
  .addGroup('Style', (b) => {
    b.addSlider('borderWidth', { label: `${W}.borderWidth`, min: 1, max: 6, step: 1, default: 2 });
    b.addSlider('glowWidth', { label: `${W}.glowWidth`, min: 0, max: 10, step: 1, default: 4 });
    b.addSlider('flowLength', { label: `${W}.flowLength`, min: 10, max: 60, step: 5, default: 30 });
    b.addSlider('opacity', { label: `${W}.opacity`, min: 0.1, max: 1, step: 0.1, default: 1 });
  }, { label: `${W}.groupStyle` })
  .addGroup('Glow', (b) => {
    b.addSlider('glowIntensity', { label: `${W}.glowIntensity`, min: 0.5, max: 3, step: 0.1, default: 1.5 });
    b.addSwitch('showCornerDots', { label: `${W}.showCornerDots`, default: true });
  }, { label: `${W}.groupGlow` })
  .addGroup('Animation', (b) => {
    b.addSwitch('animated', { label: `${W}.animated`, default: true });
    b.addSelect('flowDirection', { 
      label: `${W}.flowDirection`, 
      options: [
        { value: 'clockwise', label: `${W}.directionClockwise` },
        { value: 'counterclockwise', label: `${W}.directionCounter` }
      ],
      default: 'clockwise'
    });
    b.addSlider('animationSpeed', { label: `${W}.animationSpeed`, min: 0.5, max: 10, step: 0.5, default: 3 });
  }, { label: `${W}.groupAnimation` })
  .build();
