import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

export const controls = generateControls(PropsSchema, {
  exclude: ['points', 'sourceAnchor', 'targetAnchor', 'sourcePortId', 'targetPortId'],
  groups: {
    Content: ['routerType'],
    Style: ['stroke', 'strokeWidth', 'strokeStyle', 'opacity', 'arrowStart', 'arrowEnd', 'arrowSize'],
    Data: ['sourceNodeId', 'targetNodeId'],
  },
  overrides: {
    routerType: {
      label: 'controls.basic-line.routerType',
      options: [
        { label: 'controls.basic-line.straight', value: 'straight' },
        { label: 'controls.basic-line.orthogonal', value: 'orthogonal' },
        { label: 'controls.basic-line.curved', value: 'curved' },
      ],
    },
    stroke: { kind: 'color', label: 'controls.basic-line.stroke' },
    strokeWidth: { label: 'controls.basic-line.strokeWidth' },
    strokeStyle: {
      label: 'controls.basic-line.strokeStyle',
      options: [
        { label: 'controls.basic-line.solid', value: 'solid' },
        { label: 'controls.basic-line.dashed', value: 'dashed' },
        { label: 'controls.basic-line.dotted', value: 'dotted' },
      ],
    },
    opacity: { label: 'controls.basic-line.opacity' },
    arrowStart: {
      label: 'controls.basic-line.arrowStart',
      options: [
        { label: 'controls.basic-line.none', value: 'none' },
        { label: 'controls.basic-line.arrow', value: 'arrow' },
        { label: 'controls.basic-line.open-arrow', value: 'open-arrow' },
      ],
    },
    arrowEnd: {
      label: 'controls.basic-line.arrowEnd',
      options: [
        { label: 'controls.basic-line.none', value: 'none' },
        { label: 'controls.basic-line.arrow', value: 'arrow' },
        { label: 'controls.basic-line.open-arrow', value: 'open-arrow' },
      ],
    },
    arrowSize: { label: 'controls.basic-line.arrowSize' },
    sourceNodeId: { kind: 'nodeSelect', label: 'controls.basic-line.sourceNodeId' },
    targetNodeId: { kind: 'nodeSelect', label: 'controls.basic-line.targetNodeId' },
  },
});
