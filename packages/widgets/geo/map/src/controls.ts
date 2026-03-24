import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-geo-map';

export const controls = createControlPanel()
  .addContentGroup((b) => {
    b.addNumberInput('lat', { 
      label: `${W}.lat`,
      min: -90,
      max: 90,
      step: 0.0001,
    });
    b.addNumberInput('lng', { 
      label: `${W}.lng`,
      min: -180,
      max: 180,
      step: 0.0001,
    });
    b.addSwitch('showMarker', { label: `${W}.showMarker` });
    b.addTextInput('markerTitle', { label: `${W}.markerTitle` });
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
