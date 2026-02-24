import { PropsSchema } from './schema';
import { generateControls } from './lib/types';

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
    stroke: { kind: 'color', label: '颜色' },
    pipeBackground: { kind: 'color', label: '管道背景' },
    flowColor: { kind: 'color', label: '流动颜色' },

    // 节点选择器
    sourceNodeId: { kind: 'nodeSelect', label: '起点节点' },
    targetNodeId: { kind: 'nodeSelect', label: '终点节点' },

    // 渲染样式
    renderStyle: {
      label: '风格',
      options: [
        { label: '线条', value: 'line' },
        { label: '管道', value: 'pipe' },
      ],
    },

    // 线型
    kind: {
      label: '路线',
      options: [
        { label: '直线', value: 'straight' },
        { label: '折线', value: 'polyline' },
        { label: '曲线', value: 'curve' },
        { label: '脑图', value: 'mind' },
      ],
    },

    // 线条样式
    strokeStyle: {
      label: '线型',
      options: [
        { label: '实线', value: 'solid' },
        { label: '虚线', value: 'dashed' },
        { label: '点线', value: 'dotted' },
      ],
    },

    strokeWidth: { label: '粗细' },
    opacity: { label: '透明度' },

    // 箭头
    arrowStart: {
      label: '起点箭头',
      options: [
        { label: '无', value: 'none' },
        { label: '箭头', value: 'arrow' },
      ],
    },
    arrowEnd: {
      label: '终点箭头',
      options: [
        { label: '无', value: 'none' },
        { label: '箭头', value: 'arrow' },
      ],
    },
    arrowSize: { label: '箭头大小' },

    // 流动动画
    flowEnabled: { label: '启用流动' },
    flowSpeed: { label: '流动速度' },
    flowSpacing: { label: '流动间距' },
    flowLength: { label: '流动长度' },
  },
});
