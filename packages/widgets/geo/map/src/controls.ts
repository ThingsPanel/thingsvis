import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-geo-map';

export const controls = createControlPanel()
  .addContentGroup((b) => {
    b.addSelect('positionSource', {
      label: `${W}.positionSource`,
      options: [
        { label: `${W}.positionSourceManual`, value: 'manual' },
        { label: `${W}.positionSourceDevice`, value: 'device' },
      ],
      default: 'manual',
    });
    b.addNumberInput('lat', {
      label: `${W}.lat`,
      min: -90,
      max: 90,
      step: 0.0001,
      showWhen: { field: 'positionSource', value: 'manual' },
    });
    b.addNumberInput('lng', {
      label: `${W}.lng`,
      min: -180,
      max: 180,
      step: 0.0001,
      showWhen: { field: 'positionSource', value: 'manual' },
    });
    b.addSwitch('showMarker', { label: `${W}.showMarker` });
    b.addTextInput('markerTitle', {
      label: `${W}.markerTitle`,
      showWhen: { field: 'positionSource', value: 'manual' },
    });
  })
  .addDataGroup((b) => {
    b.addNumberInput('lat', {
      label: `${W}.deviceLatitude`,
      min: -90,
      max: 90,
      step: 0.0001,
      binding: { enabled: true, modes: ['static', 'field'] },
      description: `${W}.deviceLatitudeDesc`,
      showWhen: { field: 'positionSource', value: 'device' },
    });
    b.addNumberInput('lng', {
      label: `${W}.deviceLongitude`,
      min: -180,
      max: 180,
      step: 0.0001,
      binding: { enabled: true, modes: ['static', 'field'] },
      description: `${W}.deviceLongitudeDesc`,
      showWhen: { field: 'positionSource', value: 'device' },
    });
    b.addTextInput('markerTitle', {
      label: `${W}.deviceMarkerTitle`,
      binding: { enabled: true, modes: ['static', 'field'] },
      description: `${W}.deviceMarkerTitleDesc`,
      showWhen: { field: 'positionSource', value: 'device' },
    });
  })
  .addStyleGroup((b) => {
    b.addSlider('zoom', {
      label: `${W}.zoom`,
      min: 1,
      max: 18,
      step: 1,
      default: 13,
    });
    b.addSelect('mapStyle', {
      label: `${W}.mapStyle`,
      options: [
        { value: 'standard', label: `${W}.styleStandard` },
        { value: 'dark', label: `${W}.styleDark` },
        { value: 'light', label: `${W}.styleLight` },
      ],
      default: 'standard',
    });
    b.addSwitch('showZoomControl', { label: `${W}.showZoomControl` });
    b.addSwitch('interactive', { label: `${W}.interactive` });
  })
  .build();
