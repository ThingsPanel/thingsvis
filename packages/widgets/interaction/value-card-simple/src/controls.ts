import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-interaction-value-card-simple';

export const controls = createControlPanel()
  .addGroup('Content', (b) => {
    b.addTextInput('title', {
      label: `${W}.title`,
      binding: true,
      placeholder: 'Enter title...'
    });
    b.addTextInput('value', {
      label: `${W}.value`,
      binding: true,
      placeholder: '0'
    });
    b.addTextInput('unit', {
      label: `${W}.unit`,
      binding: true,
      placeholder: 'e.g., %, USD'
    });
    b.addSwitch('showUnit', { label: `${W}.showUnit` });
    b.addSlider('precision', {
      label: `${W}.precision`,
      min: 0,
      max: 6,
      step: 1,
      default: 0
    });
  }, { label: `${W}.groupContent` })

  .addGroup('Trend', (b) => {
    b.addSwitch('showTrend', { label: `${W}.showTrend` });
    b.addTextInput('trend', {
      label: `${W}.trend`,
      binding: true,
      placeholder: 'e.g., 12.5'
    });
    b.addTextInput('trendLabel', {
      label: `${W}.trendLabel`,
      binding: true,
      placeholder: 'e.g., vs last month'
    });
  }, { label: `${W}.groupTrend` })

  .addGroup('Style', (b) => {
    b.addSlider('titleFontSize', {
      label: `${W}.titleFontSize`,
      min: 10,
      max: 100,
      step: 1,
      default: 12
    });
    b.addSelect('valueColor', {
      label: `${W}.valueColor`,
      options: [
        { label: `${W}.color.auto`, value: 'auto' },
        { label: `${W}.color.theme`, value: 'theme' },
        { label: `${W}.color.success`, value: 'success' },
        { label: `${W}.color.warning`, value: 'warning' },
        { label: `${W}.color.danger`, value: 'danger' },
      ],
    });
    b.addTextInput('thresholds', {
      label: `${W}.thresholds`,
      placeholder: '[{\"min\":0,\"max\":50,\"color\":\"#34c759\"}]'
    });
  }, { label: `${W}.groupStyle` })

  .build();
