import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-interaction-value-card';

export const controls = createControlPanel()
  // Data Group
  .addGroup('Data', (b) => {
    b.addTextInput('title', { label: `${W}.title`, binding: true });
    b.addTextInput('value', { label: `${W}.value`, binding: true });
    b.addTextInput('suffix', { label: `${W}.suffix`, binding: true });
    b.addTextInput('subtitle', { label: `${W}.subtitle`, binding: true });
    b.addSlider('precision', { label: `${W}.precision`, min: 0, max: 6, step: 1, default: 0 });
    b.addIconPicker('icon', { label: `${W}.icon` });
    b.addSlider('iconSize', { label: `${W}.iconSize`, min: 12, max: 100, step: 1, default: 24 });
    b.addSlider('iconOpacity', { label: `${W}.iconOpacity`, min: 0, max: 1, step: 0.1, default: 0.8 });
  }, { label: `${W}.groupData` })

  // Typography Group
  .addGroup('Typography', (b) => {
    b.addSlider('titleFontSize', { label: `${W}.titleFontSize`, min: 10, max: 100, step: 1, default: 14 });
    b.addSlider('valueFontSize', { label: `${W}.valueFontSize`, min: 12, max: 200, step: 1, default: 32 });
    b.addSlider('suffixFontSize', { label: `${W}.suffixFontSize`, min: 10, max: 100, step: 1, default: 14 });
    b.addSlider('subtitleFontSize', { label: `${W}.subtitleFontSize`, min: 10, max: 100, step: 1, default: 12 });
  }, { label: `${W}.groupTypography` })

  // Layout Group
  .addGroup('Layout', (b) => {
    b.addSelect('align', {
      label: `${W}.align`,
      options: [
        { label: `${W}.alignLeft`, value: 'left' },
        { label: `${W}.alignCenter`, value: 'center' },
        { label: `${W}.alignRight`, value: 'right' },
      ],
    });
  }, { label: `${W}.groupLayout` })
  
  .build();
