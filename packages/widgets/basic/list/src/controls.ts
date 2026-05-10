import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-basic-list';

export const controls = createControlPanel()
  .addGroup(
    'Content',
    (builder) => {
      builder
        .addSwitch('showTitle', { label: `${W}.showTitle` })
        .addTextInput('title', {
          label: `${W}.title`,
          binding: true,
          showWhen: { field: 'showTitle', value: true },
        })
        .addCustom('itemsText', 'textarea', {
          label: `${W}.itemsText`,
          binding: true,
        })
        .addSelect('listMode', {
          label: `${W}.listMode`,
          options: [
            { label: `${W}.listUnordered`, value: 'unordered' },
            { label: `${W}.listOrdered`, value: 'ordered' },
          ],
        })
        .addSelect('unorderedMarker', {
          label: `${W}.unorderedMarker`,
          options: [
            { label: `${W}.markerDisc`, value: 'disc' },
            { label: `${W}.markerCircle`, value: 'circle' },
            { label: `${W}.markerSquare`, value: 'square' },
            { label: `${W}.markerDash`, value: 'dash' },
            { label: `${W}.markerCheck`, value: 'check' },
            { label: `${W}.markerCustom`, value: 'custom' },
          ],
          showWhen: { field: 'listMode', value: 'unordered' },
        })
        .addTextInput('customBullet', {
          label: `${W}.customBullet`,
          binding: true,
          showWhen: { field: 'unorderedMarker', value: 'custom' },
        })
        .addSelect('numberStyle', {
          label: `${W}.numberStyle`,
          options: [
            { label: `${W}.numberDot`, value: 'dot' },
            { label: `${W}.numberParenClose`, value: 'parenClose' },
            { label: `${W}.numberParenAround`, value: 'parenAround' },
            { label: `${W}.numberPlain`, value: 'plain' },
          ],
          showWhen: { field: 'listMode', value: 'ordered' },
        })
        .addNumberInput('orderStart', {
          label: `${W}.orderStart`,
          showWhen: { field: 'listMode', value: 'ordered' },
        });
    },
    { label: `${W}.groupContent` },
  )
  .addGroup(
    'Regions',
    (builder) => {
      builder
        .addSwitch('showLeading', { label: `${W}.showLeading` })
        .addSwitch('showLeftText', { label: `${W}.showLeftText` })
        .addSwitch('showRightText', { label: `${W}.showRightText` });
    },
    { label: `${W}.groupRegions` },
  )
  .addGroup(
    'Typography',
    (builder) => {
      builder
        .addSlider('titleFontSize', {
          label: `${W}.titleFontSize`,
          min: 12,
          max: 28,
          step: 1,
          default: 16,
          showWhen: { field: 'showTitle', value: true },
        })
        .addSlider('leftFontSize', {
          label: `${W}.leftFontSize`,
          min: 8,
          max: 36,
          step: 1,
          default: 14,
          showWhen: { field: 'showLeftText', value: true },
        })
        .addSlider('rightFontSize', {
          label: `${W}.rightFontSize`,
          min: 8,
          max: 36,
          step: 1,
          default: 14,
          showWhen: { field: 'showRightText', value: true },
        })
        .addSlider('leadingFontSize', {
          label: `${W}.leadingFontSize`,
          min: 8,
          max: 36,
          step: 1,
          default: 14,
          showWhen: { field: 'showLeading', value: true },
        })
        .addSlider('rowGap', {
          label: `${W}.rowGap`,
          min: 0,
          max: 64,
          step: 1,
          default: 10,
        });
    },
    { label: `${W}.groupTypography` },
  )
  .addGroup(
    'Color',
    (builder) => {
      builder
        .addColorPicker('titleColor', {
          label: `${W}.titleColor`,
          binding: true,
          showWhen: { field: 'showTitle', value: true },
        })
        .addColorPicker('leftColor', {
          label: `${W}.leftColor`,
          binding: true,
          showWhen: { field: 'showLeftText', value: true },
        })
        .addColorPicker('rightColor', {
          label: `${W}.rightColor`,
          binding: true,
          showWhen: { field: 'showRightText', value: true },
        })
        .addColorPicker('leadingColor', {
          label: `${W}.leadingColor`,
          binding: true,
          showWhen: { field: 'showLeading', value: true },
        });
    },
    { label: `${W}.groupColor` },
  )
  .build();
