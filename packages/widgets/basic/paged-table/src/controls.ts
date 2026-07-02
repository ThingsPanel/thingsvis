import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.basic-paged-table';

export const controls = createControlPanel()
  .addGroup('Data', (b) => {
    b.addJsonEditor('columns', {
      label: `${W}.columns`,
      placeholder: '[{"key":"deviceName","title":"设备名称"}]',
      binding: { enabled: false, modes: ['static'] },
    });
    b.addSlider('pageSize', {
      label: `${W}.pageSize`,
      min: 5,
      max: 50,
      step: 5,
      default: 10,
    });
    b.addTextInput('groupId', { label: `${W}.groupId`, placeholder: '__all__' });
    b.addTextInput('keyword', { label: `${W}.keyword` });
    b.addTextInput('deviceConfigId', { label: `${W}.deviceConfigId` });
  }, { label: `${W}.groupData` })

  .addGroup('Header', (b) => {
    b.addSwitch('showHeader', { label: `${W}.showHeader` });
    b.addColorPicker('headerColor', { label: `${W}.headerColor` });
    b.addColorPicker('headerBgColor', { label: `${W}.headerBgColor` });
    b.addSlider('headerFontSize', {
      label: `${W}.headerFontSize`,
      min: 10,
      max: 40,
      step: 1,
      default: 14,
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

  .addGroup('Body', (b) => {
    b.addColorPicker('bodyColor', { label: `${W}.bodyColor` });
    b.addSlider('bodyFontSize', {
      label: `${W}.bodyFontSize`,
      min: 10,
      max: 40,
      step: 1,
      default: 13,
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
    b.addColorPicker('rowBorderColor', { label: `${W}.rowBorderColor` });
  }, { label: `${W}.groupBody` })

  .addGroup('Density', (b) => {
    b.addSlider('cellPadding', {
      label: `${W}.cellPadding`,
      min: 0,
      max: 40,
      step: 1,
      default: 10,
    });
    b.addSwitch('scrollEnabled', { label: `${W}.scrollEnabled` });
  }, { label: `${W}.groupDensity` })

  .build();
