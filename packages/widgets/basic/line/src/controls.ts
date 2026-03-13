import { PropsSchema } from './schema';
import { generateControls } from '@thingsvis/widget-sdk';

/**
 * 连线/管道配置面板
 * 参考竞品: draw.io, Figma, ProcessOn
 *
 * 分组:
 * - Content: 线型
 * - Style: 样式、管道、箭头、流动
 * - Data: 节点连接
 */
export const controls = generateControls(PropsSchema, {
  // 排除不需要在面板中显示的字段
  exclude: [
    'lineCap',
    'borderWidth',
    'borderColor', 
    'sloppiness',
    'arrowType',
    'direction',
    'dashPattern',
    'points',
    'sourceAnchor',
    'targetAnchor',
  ],
  groups: {
    // 内容 - 线型
    Content: ['kind'],

    // 样式 - 主要配置
    Style: [
      'renderStyle',
      'stroke',
      'strokeWidth',
      'strokeStyle',
      'opacity',
      // 管道背景
      'pipeBackground',
      // 箭头
      'arrowStart',
      'arrowEnd',
      'arrowSize',
      // 流动动画
      'flowEnabled',
      'flowSpeed',
      'flowSpacing',
      'flowLength',
      'flowColor',
    ],

    // 数据 - 节点绑定
    Data: ['sourceNodeId', 'targetNodeId'],
  },
  overrides: {
    // 颜色选择器
    stroke: { kind: 'color', label: 'widgets.thingsvis-widget-basic-line.label_1' },
    pipeBackground: { kind: 'color', label: 'widgets.thingsvis-widget-basic-line.label_2' },
    flowColor: { kind: 'color', label: 'widgets.thingsvis-widget-basic-line.label_3' },

    // 节点选择器
    sourceNodeId: { kind: 'nodeSelect', label: 'widgets.thingsvis-widget-basic-line.label_4' },
    targetNodeId: { kind: 'nodeSelect', label: 'widgets.thingsvis-widget-basic-line.label_5' },

    // 渲染样式
    renderStyle: {
      label: 'widgets.thingsvis-widget-basic-line.label_6',
      options: [
        { label: 'widgets.thingsvis-widget-basic-line.label_7', value: 'line' },
        { label: 'widgets.thingsvis-widget-basic-line.label_8', value: 'pipe' },
      ],
    },

    // 线型
    kind: {
      label: 'widgets.thingsvis-widget-basic-line.label_9',
      options: [
        { label: 'widgets.thingsvis-widget-basic-line.label_10', value: 'straight' },
        { label: 'widgets.thingsvis-widget-basic-line.label_11', value: 'polyline' },
        { label: 'widgets.thingsvis-widget-basic-line.label_12', value: 'curve' },
        { label: 'widgets.thingsvis-widget-basic-line.label_13', value: 'mind' },
      ],
    },

    // 线条样式
    strokeStyle: {
      label: 'widgets.thingsvis-widget-basic-line.label_14',
      options: [
        { label: 'widgets.thingsvis-widget-basic-line.label_15', value: 'solid' },
        { label: 'widgets.thingsvis-widget-basic-line.label_16', value: 'dashed' },
        { label: 'widgets.thingsvis-widget-basic-line.label_17', value: 'dotted' },
      ],
    },

    strokeWidth: { label: 'widgets.thingsvis-widget-basic-line.label_18' },
    opacity: { label: 'widgets.thingsvis-widget-basic-line.label_19' },

    // 箭头
    arrowStart: {
      label: 'widgets.thingsvis-widget-basic-line.label_20',
      options: [
        { label: 'widgets.thingsvis-widget-basic-line.label_21', value: 'none' },
        { label: 'widgets.thingsvis-widget-basic-line.label_22', value: 'arrow' },
      ],
    },
    arrowEnd: {
      label: 'widgets.thingsvis-widget-basic-line.label_23',
      options: [
        { label: 'widgets.thingsvis-widget-basic-line.label_24', value: 'none' },
        { label: 'widgets.thingsvis-widget-basic-line.label_25', value: 'arrow' },
      ],
    },
    arrowSize: { label: 'widgets.thingsvis-widget-basic-line.label_26' },

    // 流动动画
    flowEnabled: { label: 'widgets.thingsvis-widget-basic-line.label_27' },
    flowSpeed: { label: 'widgets.thingsvis-widget-basic-line.label_28' },
    flowSpacing: { label: 'widgets.thingsvis-widget-basic-line.label_29' },
    flowLength: { label: 'widgets.thingsvis-widget-basic-line.label_30' },
  },
});
