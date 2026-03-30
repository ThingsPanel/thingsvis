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
      label: 'editor.controls.basic-line.routerType',
      options: [
        { label: 'editor.controls.basic-line.straight', value: 'straight' },
        { label: 'editor.controls.basic-line.orthogonal', value: 'orthogonal' },
        { label: 'editor.controls.basic-line.curved', value: 'curved' },
      ],
    },
    stroke: { kind: 'color', label: 'editor.controls.basic-line.stroke' },
    strokeWidth: { label: 'editor.controls.basic-line.strokeWidth' },
    strokeStyle: {
      label: 'editor.controls.basic-line.strokeStyle',
      options: [
        { label: 'editor.controls.basic-line.solid', value: 'solid' },
        { label: 'editor.controls.basic-line.dashed', value: 'dashed' },
        { label: 'editor.controls.basic-line.dotted', value: 'dotted' },
      ],
    },
    opacity: { label: 'editor.controls.basic-line.opacity' },
    arrowStart: {
      label: 'editor.controls.basic-line.arrowStart',
      options: [
        { label: 'editor.controls.basic-line.none', value: 'none' },
        { label: 'editor.controls.basic-line.arrow', value: 'arrow' },
        { label: 'editor.controls.basic-line.open-arrow', value: 'open-arrow' },
      ],
    },
    arrowEnd: {
      label: 'editor.controls.basic-line.arrowEnd',
      options: [
        { label: 'editor.controls.basic-line.none', value: 'none' },
        { label: 'editor.controls.basic-line.arrow', value: 'arrow' },
        { label: 'editor.controls.basic-line.open-arrow', value: 'open-arrow' },
      ],
    },
    arrowSize: { label: 'editor.controls.basic-line.arrowSize' },
    sourceNodeId: { kind: 'nodeSelect', label: 'editor.controls.basic-line.sourceNodeId' },
    targetNodeId: { kind: 'nodeSelect', label: 'editor.controls.basic-line.targetNodeId' },
  },
});
