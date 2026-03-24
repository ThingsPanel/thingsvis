import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
  groups: {
    Map: ['areaColor', 'regionBorderColor', 'regionBorderWidth', 'emphasisAreaColor', 'showLabel', 'labelColor'],
    VisualMap: ['visualMapMin', 'visualMapMax', 'inRangeColorStart', 'inRangeColorEnd'],
  },
  exclude: ['borderColor', 'borderWidth'],

  overrides: {
    areaColor: { kind: 'color' },
    regionBorderColor: { kind: 'color' },
    emphasisAreaColor: { kind: 'color' },
    labelColor: { kind: 'color' },
    inRangeColorStart: { kind: 'color' },
    inRangeColorEnd: { kind: 'color' },
  },

  bindings: {},
});
