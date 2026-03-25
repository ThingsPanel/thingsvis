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
      'pipeInnerColor',
      'flowEnabled',
      'glowEffect',
      'glowColor',
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
    pipeBackground: { kind: 'color', label: '管壁颜色' },
    pipeInnerColor: { kind: 'color', label: '管芯颜色' },
    flowEnabled: { label: '流动动画' },
    glowEffect: { label: '霓虹发光', showWhen: { field: 'flowEnabled', value: true } },
    glowColor: { 
      kind: 'color', 
      label: '发光颜色', 
      showWhen: { field: 'glowEffect', value: true }
    },
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
