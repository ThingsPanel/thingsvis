import { createControlPanel } from '@thingsvis/widget-sdk';
const W = 'widgets.thingsvis-widget-decoration-border-corner';

export const controls = createControlPanel()
  .addGroup('Color', (b) => {
    b.addSwitch('useThemeColor', { label: `${W}.useThemeColor`, default: true });
    b.addColorPicker('color', { label: `${W}.color`, binding: true });
    b.addColorPicker('secondaryColor', { label: `${W}.secondaryColor`, binding: true });
    b.addColorPicker('glowColor', { label: `${W}.glowColor`, binding: true });
  }, { label: `${W}.groupColor` })
  .addGroup('Style', (b) => {
    b.addSlider('lineWidth', { label: `${W}.lineWidth`, min: 1, max: 8, step: 1, default: 3 });
    b.addSlider('cornerLength', { label: `${W}.cornerLength`, min: 10, max: 50, step: 5, default: 25 });
    b.addSlider('opacity', { label: `${W}.opacity`, min: 0.1, max: 1, step: 0.1, default: 1 });
  }, { label: `${W}.groupStyle` })
  .addGroup('Glow', (b) => {
    b.addSlider('glowIntensity', { label: `${W}.glowIntensity`, min: 0, max: 3, step: 0.1, default: 1.5 });
    b.addSlider('glowBlur', { label: `${W}.glowBlur`, min: 2, max: 20, step: 1, default: 8 });
    b.addSwitch('innerGlow', { label: `${W}.innerGlow`, default: true });
  }, { label: `${W}.groupGlow` })
  .addGroup('Animation', (b) => {
    b.addSwitch('animated', { label: `${W}.animated`, default: true });
    b.addSwitch('pulseMode', { label: `${W}.pulseMode`, default: false });
    b.addSlider('animationSpeed', { label: `${W}.animationSpeed`, min: 0.5, max: 10, step: 0.5, default: 2 });
  }, { label: `${W}.groupAnimation` })
  .build();
