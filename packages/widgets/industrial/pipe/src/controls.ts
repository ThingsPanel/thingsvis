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
    pipeColor: { kind: 'color', label: 'editor.controls.industrial-pipe.pipeColor' },
    pipeBackground: { kind: 'color', label: 'editor.controls.industrial-pipe.pipeBackground' },
    flowColor: {
      kind: 'color',
      label: 'editor.controls.industrial-pipe.flowColor',
      showWhen: { field: 'flowEnabled', value: true },
    },
    glowEnabled: { label: 'editor.controls.industrial-pipe.glowEnabled' },
    glowColor: {
      kind: 'color',
      label: 'editor.controls.industrial-pipe.glowColor',
      showWhen: { field: 'glowEnabled', value: true },
    },
    flowDirection: {
      label: 'editor.controls.industrial-pipe.flowDirection',
      showWhen: { field: 'flowEnabled', value: true },
      options: [
        { label: 'editor.controls.industrial-pipe.forward', value: 'forward' },
        { label: 'editor.controls.industrial-pipe.reverse', value: 'reverse' },
      ],
    },
    sourceNodeId: { kind: 'nodeSelect', label: 'editor.controls.industrial-pipe.sourceNode' },
    targetNodeId: { kind: 'nodeSelect', label: 'editor.controls.industrial-pipe.targetNode' },
  },
});
