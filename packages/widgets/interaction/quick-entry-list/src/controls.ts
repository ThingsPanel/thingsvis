import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-interaction-quick-entry-list';

export const controls = createControlPanel()
  .addGroup(
    'Content',
    (builder) => {
      builder.addTextInput('title', { label: `${W}.title`, binding: true });
      builder.addSwitch('showTitle', { label: `${W}.showTitle`, default: true });
      builder.addJsonEditor('items', {
        label: `${W}.items`,
        description: `${W}.itemsDescription`,
        binding: true,
      });
      builder.addSwitch('showDivider', { label: `${W}.showDivider`, default: true });
    },
    { label: `${W}.groupContent` },
  )
  .addGroup(
    'Style',
    (builder) => {
      builder.addSlider('titleFontSize', { label: `${W}.titleFontSize`, min: 12, max: 32, step: 1, default: 18 });
      builder.addSlider('itemTitleFontSize', { label: `${W}.itemTitleFontSize`, min: 12, max: 28, step: 1, default: 16 });
      builder.addSlider('descriptionFontSize', { label: `${W}.descriptionFontSize`, min: 10, max: 24, step: 1, default: 13 });
      builder.addSlider('iconSize', { label: `${W}.iconSize`, min: 32, max: 80, step: 2, default: 52 });
      builder.addSlider('itemPadding', { label: `${W}.itemPadding`, min: 8, max: 32, step: 1, default: 16 });
      builder.addColorPicker('textColor', { label: `${W}.textColor`, default: '#172033' });
      builder.addColorPicker('descriptionColor', { label: `${W}.descriptionColor`, default: '#64748b' });
      builder.addColorPicker('dividerColor', { label: `${W}.dividerColor`, default: '#e8edf5' });
      builder.addColorPicker('hoverColor', { label: `${W}.hoverColor`, default: '#f8faff' });
    },
    { label: `${W}.groupStyle` },
  )
  .build();
