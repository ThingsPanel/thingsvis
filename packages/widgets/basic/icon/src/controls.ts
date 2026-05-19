import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-basic-icon';

export const controls = createControlPanel()
  .addGroup(
    'Content',
    (builder) => {
      builder
        .addSelect('iconSource', {
          label: `${W}.iconSource`,
          options: [
            { label: `${W}.iconSourceLocal`, value: 'local' },
            { label: `${W}.iconSourceBuiltin`, value: 'builtin' },
          ],
        })
        .addLocalIconPicker('localIconId', {
          label: `${W}.localIconId`,
          showWhen: { field: 'iconSource', value: 'local' },
        })
        .addSelect('iconName', {
          label: `${W}.iconName`,
          showWhen: { field: 'iconSource', value: 'builtin' },
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
        });
    },
    { label: `${W}.groupContent` },
  )
  .addGroup(
    'Style',
    (builder) => {
      builder.addColorPicker('color', { label: `${W}.color`, binding: true });
    },
    { label: `${W}.groupStyle` },
  )
  .build();
