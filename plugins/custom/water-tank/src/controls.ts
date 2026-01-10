import { PropsSchema } from './schema';
import { generateControls } from './lib/types';

export const controls = generateControls(PropsSchema, {
  groups: {
    Content: ['waterLevel'],
    Style: [
      'waterColor',
      'tankBackground',
      'tankBorder',
      'borderWidth',
      'showWave',
      'waveSpeed',
      'waveHeight',
      'showLabel',
      'labelColor',
      'opacity',
    ],
  },
  overrides: {
    waterLevel: { label: '水位(%)' },
    waterColor: { kind: 'color', label: '水的颜色' },
    tankBackground: { kind: 'color', label: '水池背景' },
    tankBorder: { kind: 'color', label: '边框颜色' },
    borderWidth: { label: '边框宽度' },
    showWave: { label: '波浪动画' },
    waveSpeed: { label: '波浪速度' },
    waveHeight: { label: '波浪高度' },
    showLabel: { label: '显示水位' },
    labelColor: { kind: 'color', label: '文字颜色' },
    opacity: { label: '透明度' },
  },
  bindings: {
    waterLevel: {
      enabled: true,
      modes: ['static', 'field', 'expr'],
    },
  },
});
