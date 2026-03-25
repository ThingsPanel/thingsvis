import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
  exclude: ['points', 'sourceAnchor', 'targetAnchor', 'lineCap'],
  groups: {
    Style: [
      'stroke',
      'strokeWidth',
      'strokeStyle',
      'opacity',
      'pipeBackground',
      'flowEnabled',
      'flowDirection',
      'flowSpeed',
      'flowSpacing',
      'flowLength',
      'flowColor',
    ],
    Data: ['sourceNodeId', 'targetNodeId'],
  },
  overrides: {
    stroke: { kind: 'color', label: '管道颜色' },
    strokeWidth: { label: '管道宽度' },
    strokeStyle: {
      label: '线型',
      options: [
        { label: '实线', value: 'solid' },
        { label: '虚线', value: 'dashed' },
        { label: '点线', value: 'dotted' },
      ],
    },
    opacity: { label: '透明度' },
    pipeBackground: { kind: 'color', label: '管道背景' },
    flowEnabled: { label: '流动动画' },
    flowDirection: {
      label: '流动方向',
      showWhen: { field: 'flowEnabled', value: true },
      options: [
        { label: '正向', value: 'forward' },
        { label: '反向', value: 'reverse' },
      ],
    },
    flowSpeed: { label: '流动速度', showWhen: { field: 'flowEnabled', value: true } },
    flowSpacing: { label: '流动间距', showWhen: { field: 'flowEnabled', value: true } },
    flowLength: { label: '流动长度', showWhen: { field: 'flowEnabled', value: true } },
    flowColor: {
      kind: 'color',
      label: '流动颜色',
      showWhen: { field: 'flowEnabled', value: true },
    },
    sourceNodeId: { kind: 'nodeSelect', label: '起点节点' },
    targetNodeId: { kind: 'nodeSelect', label: '终点节点' },
  },
});
