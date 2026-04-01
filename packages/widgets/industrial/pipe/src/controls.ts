import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
  exclude: ['waypoints', 'sourceAnchor', 'targetAnchor', 'points', 'sourcePortId', 'targetPortId'],
  groups: {
    'controls.industrial-pipe.groupStyle': [
      'pipeColor',
      'pipeBackground',
      'strokeWidth',
      'opacity',
      'glowEnabled',
      'glowColor',
      'glowIntensity',
    ],
    'controls.industrial-pipe.groupFlow': [
      'flowEnabled',
      'flowSpeed',
      'flowDirection',
      'flowSpacing',
      'flowLength',
      'flowColor',
    ],
    'controls.industrial-pipe.groupData': ['sourceNodeId', 'targetNodeId'],
  },
  overrides: {
    pipeColor: { kind: 'color', label: 'controls.industrial-pipe.pipeColor' },
    pipeBackground: { kind: 'color', label: 'controls.industrial-pipe.pipeBackground' },
    strokeWidth: { label: 'controls.industrial-pipe.strokeWidth' },
    flowEnabled: {
      label: 'controls.industrial-pipe.flowEnabled',
      binding: { enabled: true, modes: ['static', 'field', 'expr'] },
    },
    flowSpeed: {
      label: 'controls.industrial-pipe.flowSpeed',
      showWhen: { field: 'flowEnabled', value: true },
      binding: { enabled: true, modes: ['static', 'field', 'expr'] },
    },
    flowLength: {
      label: 'controls.industrial-pipe.flowLength',
      showWhen: { field: 'flowEnabled', value: true },
    },
    flowSpacing: {
      label: 'controls.industrial-pipe.flowSpacing',
      showWhen: { field: 'flowEnabled', value: true },
    },
    flowColor: {
      kind: 'color',
      label: 'controls.industrial-pipe.flowColor',
      showWhen: { field: 'flowEnabled', value: true },
      binding: { enabled: true, modes: ['static', 'field', 'expr'] },
    },
    glowEnabled: {
      label: 'controls.industrial-pipe.glowEnabled',
      binding: { enabled: true, modes: ['static', 'field', 'expr'] },
    },
    glowColor: {
      kind: 'color',
      label: 'controls.industrial-pipe.glowColor',
      showWhen: { field: 'glowEnabled', value: true },
      binding: { enabled: true, modes: ['static', 'field', 'expr'] },
    },
    glowIntensity: {
      label: 'controls.industrial-pipe.glowIntensity',
      showWhen: { field: 'glowEnabled', value: true },
    },
    flowDirection: {
      label: 'controls.industrial-pipe.flowDirection',
      showWhen: { field: 'flowEnabled', value: true },
      binding: { enabled: true, modes: ['static', 'field', 'expr'] },
      options: [
        { label: 'controls.industrial-pipe.forward', value: 'forward' },
        { label: 'controls.industrial-pipe.reverse', value: 'reverse' },
      ],
    },
    sourceNodeId: { kind: 'nodeSelect', label: 'controls.industrial-pipe.sourceNode' },
    targetNodeId: { kind: 'nodeSelect', label: 'controls.industrial-pipe.targetNode' },
  },
});
