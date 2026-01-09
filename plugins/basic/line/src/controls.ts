import { PropsSchema } from './schema';
import { generateControls } from './lib/types';

export const controls = generateControls(PropsSchema, {
  groups: {
    Content: ['kind', 'points'],
    Style: [
      // Stroke 描边
      'stroke',
      'strokeWidth',
      'strokeStyle',
      'sloppiness',
      // Arrow 箭头
      'arrowType',
      'arrowStart',
      'arrowEnd',
      'arrowSize',
      // Opacity 透明度
      'opacity',
    ],
    Advanced: [
      'lineCap',
      // Flow 流动
      'flowEnabled',
      'flowSpeed',
      'flowSpacing',
      // Legacy
      'direction',
      'dashPattern',
    ],
  },
  overrides: {
    stroke: { kind: 'color' },
    points: { kind: 'json' },
  },
});
