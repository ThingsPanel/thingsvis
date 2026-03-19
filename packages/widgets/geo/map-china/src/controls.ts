import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
  groups: {
    Map: ['areaColor', 'borderColor', 'borderWidth', 'emphasisAreaColor', 'showLabel', 'labelColor'],
    VisualMap: ['visualMapMin', 'visualMapMax', 'inRangeColorStart', 'inRangeColorEnd'],
  },

  overrides: {
    areaColor: { kind: 'color' },
    borderColor: { kind: 'color' },
    emphasisAreaColor: { kind: 'color' },
    labelColor: { kind: 'color' },
    inRangeColorStart: { kind: 'color' },
    inRangeColorEnd: { kind: 'color' },
  },

  bindings: {},
});
