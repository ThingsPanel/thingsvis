import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.basic-table';

export const controls = createControlPanel()
  // Data Group
  .addGroup('Data', (b) => {
    b.addJsonEditor('columns', { 
      label: `${W}.columns`,
      placeholder: '[{"key":"name","title":"Name"}]',
      binding: { enabled: true, modes: ['static', 'field', 'expr'] }
    });
    b.addJsonEditor('data', { 
      label: `${W}.data`,
      placeholder: '[{"name":"Item 1"}]',
      binding: { enabled: true, modes: ['static', 'field', 'expr'] }
    });
  }, { label: `${W}.groupData` })

  // Title Group
  .addGroup('Title', (b) => {
    b.addSwitch('showTitle', { label: '显示标题', binding: true });
    b.addTextInput('title', { label: '组件标题', binding: true });
  }, { label: '标题' })
  
  // Header Group
  .addGroup('Header', (b) => {
    b.addSwitch('showHeader', { label: `${W}.showHeader` });
    b.addColorPicker('headerColor', { label: `${W}.headerColor` });
    b.addColorPicker('headerBgColor', { label: `${W}.headerBgColor` });
    b.addSlider('headerFontSize', { 
      label: `${W}.headerFontSize`,
      min: 10, max: 40, step: 1, default: 14 
    });
    b.addSelect('headerWeight', {
      label: `${W}.headerWeight`,
      options: [
        { label: `${W}.weightNormal`, value: '400' },
        { label: `${W}.weightMedium`, value: '500' },
        { label: `${W}.weightSemibold`, value: '600' },
        { label: `${W}.weightBold`, value: '700' },
      ],
    });
  }, { label: `${W}.groupHeader` })

  // Body Group
  .addGroup('Body', (b) => {
    b.addColorPicker('bodyColor', { label: `${W}.bodyColor` });
    b.addSlider('bodyFontSize', { 
      label: `${W}.bodyFontSize`,
      min: 10, max: 40, step: 1, default: 13 
    });
    b.addSelect('bodyWeight', {
      label: `${W}.bodyWeight`,
      options: [
        { label: `${W}.weightNormal`, value: '400' },
        { label: `${W}.weightMedium`, value: '500' },
        { label: `${W}.weightSemibold`, value: '600' },
        { label: `${W}.weightBold`, value: '700' },
      ],
    });
    b.addSwitch('showStripe', { label: `${W}.showStripe` });
    b.addColorPicker('stripeColor', { label: `${W}.stripeColor` });
    b.addSwitch('showBorder', { label: `${W}.showBorder` });
  }, { label: `${W}.groupBody` })

  // Density Group
  .addGroup('Density', (b) => {
    b.addSlider('cellPadding', { 
      label: `${W}.cellPadding`,
      min: 0, max: 40, step: 1, default: 10 
    });
  }, { label: `${W}.groupDensity` })
  
  .build();
