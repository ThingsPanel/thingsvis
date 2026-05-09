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
            { label: `${W}.iconShieldCheck`, value: 'shield-check' },
            { label: `${W}.iconActivity`, value: 'activity' },
            { label: `${W}.iconThermometer`, value: 'thermometer' },
            { label: `${W}.iconDroplet`, value: 'droplet' },
            { label: `${W}.iconGauge`, value: 'gauge' },
            { label: `${W}.iconZap`, value: 'zap' },
            { label: `${W}.iconAlertTriangle`, value: 'alert-triangle' },
            { label: `${W}.iconCheckCircle`, value: 'check-circle' },
            { label: `${W}.iconXCircle`, value: 'x-circle' },
            { label: `${W}.iconTrendingUp`, value: 'trending-up' },
            { label: `${W}.iconTrendingDown`, value: 'trending-down' },
            { label: `${W}.iconClock`, value: 'clock' },
            { label: `${W}.iconCpu`, value: 'cpu' },
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
