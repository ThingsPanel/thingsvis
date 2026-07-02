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

  .addGroup('Icon', (b) => {
    b.addSwitch('showIcon', { label: `${W}.showIcon` });
    b.addIconPicker('icon', {
      label: `${W}.icon`,
      showWhen: { field: 'showIcon', value: true },
    });
    b.addSelect('iconPosition', {
      label: `${W}.iconPosition`,
      options: [
        { label: `${W}.iconPosition.top`, value: 'top' },
        { label: `${W}.iconPosition.left`, value: 'left' },
        { label: `${W}.iconPosition.right`, value: 'right' },
      ],
      showWhen: { field: 'showIcon', value: true },
    });
    b.addSlider('iconSize', {
      label: `${W}.iconSize`,
      min: 12,
      max: 100,
      step: 1,
      default: 32,
      showWhen: { field: 'showIcon', value: true },
    });
    b.addColorPicker('iconColor', {
      label: `${W}.iconColor`,
      showWhen: { field: 'showIcon', value: true },
    });
    b.addColorPicker('iconBackgroundColor', {
      label: `${W}.iconBackgroundColor`,
      showWhen: { field: 'showIcon', value: true },
    });
  }, { label: `${W}.groupIcon` })

  .addGroup('Style', (b) => {
    b.addSlider('titleFontSize', {
      label: `${W}.titleFontSize`,
      min: 10,
      max: 100,
      step: 1,
      default: 12,
    });
    b.addSlider('valueFontSize', {
      label: `${W}.valueFontSize`,
      min: 12,
      max: 200,
      step: 1,
      default: 28,
    });
    b.addSlider('unitFontSize', {
      label: `${W}.unitFontSize`,
      min: 10,
      max: 100,
      step: 1,
      default: 13,
    });
    b.addColorPicker('titleColor', { label: `${W}.titleColor`, default: '' });
    b.addColorPicker('valueColor', { label: `${W}.valueColor`, default: '' });
    b.addColorPicker('unitColor', { label: `${W}.unitColor`, default: '' });
  }, { label: `${W}.groupStyle` })

  .build();
