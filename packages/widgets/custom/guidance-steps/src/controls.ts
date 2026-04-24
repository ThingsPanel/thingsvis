import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-custom-guidance-steps';

export const controls = createControlPanel()
  .addGroup(
    'Content',
    (builder) => {
      builder.addJsonEditor('items', {
        label: `${W}.items`,
        description: `${W}.itemsDescription`,
        binding: true,
      });
    },
    { label: `${W}.groupContent` },
  )
  .addGroup(
    'Style',
    (builder) => {
      builder.addColorPicker('themeColor', {
        label: `${W}.themeColor`,
        default: '#6965db',
      });
      builder.addSlider('titleFontSize', {
        label: `${W}.titleFontSize`,
        min: 10,
        max: 40,
        step: 1,
        default: 16,
      });
      builder.addSlider('descFontSize', {
        label: `${W}.descFontSize`,
        min: 10,
        max: 40,
        step: 1,
        default: 14,
      });
    },
    { label: `${W}.groupStyle` },
  )
  .build();
