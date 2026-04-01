import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
  exclude: ['waypoints', 'sourceAnchor', 'targetAnchor', 'points', 'sourcePortId', 'targetPortId'],
  groups: {
    Style: [
      'pipeColor',
      'pipeBackground',
      'strokeWidth',
      'opacity',
      'glowEnabled',
      'glowColor',
      'glowIntensity',
    ],
    Flow: [
      'flowEnabled',
      'flowSpeed',
      'flowDirection',
      'flowSpacing',
      'flowLength',
      'flowColor',
    ],
    Data: ['sourceNodeId', 'targetNodeId'],
  },
  overrides: {
    pipeColor: { kind: 'color', label: 'controls.industrial-pipe.pipeColor' },
    pipeBackground: { kind: 'color', label: 'controls.industrial-pipe.pipeBackground' },
    flowColor: {
      kind: 'color',
      label: 'controls.industrial-pipe.flowColor',
      showWhen: { field: 'flowEnabled', value: true },
    },
    glowEnabled: { label: 'controls.industrial-pipe.glowEnabled' },
    glowColor: {
      kind: 'color',
      label: 'controls.industrial-pipe.glowColor',
      showWhen: { field: 'glowEnabled', value: true },
    },
    flowDirection: {
      label: 'controls.industrial-pipe.flowDirection',
      showWhen: { field: 'flowEnabled', value: true },
      options: [
        { label: 'controls.industrial-pipe.forward', value: 'forward' },
        { label: 'controls.industrial-pipe.reverse', value: 'reverse' },
      ],
    },
    sourceNodeId: { kind: 'nodeSelect', label: 'controls.industrial-pipe.sourceNode' },
    targetNodeId: { kind: 'nodeSelect', label: 'controls.industrial-pipe.targetNode' },
  },
});
