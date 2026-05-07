import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-basic-icon';

export const controls = createControlPanel()
  .addGroup(
    'Content',
    (builder) => {
      builder
        .addSelect('iconName', {
          label: `${W}.iconName`,
          options: [
            { label: `${W}.iconSquare`, value: 'square' },
            { label: `${W}.iconCircle`, value: 'circle' },
            { label: `${W}.iconTriangle`, value: 'triangle' },
            { label: `${W}.iconBolt`, value: 'bolt' },
            { label: `${W}.iconStar`, value: 'star' },
            { label: `${W}.iconHeart`, value: 'heart' },
            { label: `${W}.iconPin`, value: 'pin' },
            { label: `${W}.iconBell`, value: 'bell' },
          ],
        })
        .addSlider('paddingSize', {
          label: `${W}.paddingSize`,
          min: 0,
          max: 32,
          step: 1,
          default: 12,
        })
        .addSlider('strokeWidth', {
          label: `${W}.strokeWidth`,
          min: 1,
          max: 4,
          step: 0.5,
          default: 2,
        });
    },
    { label: `${W}.groupContent` },
  )
  .addGroup(
    'Style',
    (builder) => {
      builder
        .addColorPicker('color', { label: `${W}.color`, binding: true })
        .addColorPicker('backgroundColor', { label: `${W}.backgroundColor`, binding: true })
        .addSlider('backgroundOpacity', {
          label: `${W}.backgroundOpacity`,
          min: 0,
          max: 1,
          step: 0.01,
          default: 1,
        })
        .addSlider('cornerRadius', {
          label: `${W}.cornerRadius`,
          min: 0,
          max: 32,
          step: 1,
          default: 12,
        })
        .addSlider('opacity', {
          label: `${W}.opacity`,
          min: 0,
          max: 1,
          step: 0.01,
          default: 1,
        });
    },
    { label: `${W}.groupStyle` },
  )
  .addGroup(
    'Frame',
    (builder) => {
      builder
        .addSwitch('showFrame', { label: `${W}.showFrame` })
        .addColorPicker('frameColor', {
          label: `${W}.frameColor`,
          showWhen: { field: 'showFrame', value: true },
        })
        .addSlider('frameWidth', {
          label: `${W}.frameWidth`,
          min: 0,
          max: 8,
          step: 1,
          default: 1,
          showWhen: { field: 'showFrame', value: true },
        });
    },
    { label: `${W}.groupFrame`, expanded: false },
  )
  .build();
