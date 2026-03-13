import type { NodeState } from '@thingsvis/kernel';

export type LeaferDisplayObject = {
  set?: (props: Record<string, unknown>) => void;
  remove?: () => void;
  on?: (event: string, cb: () => void) => void;
  x?: number;
  y?: number;
};

export type OverlayInstance = {
  element: HTMLElement;
  update?: (node: NodeState) => void;
  destroy?: () => void;
};

export type RendererFactory = {
  create: (node: NodeState) => LeaferDisplayObject;
  update: (instance: LeaferDisplayObject, node: NodeState) => void;
  destroy: (instance: LeaferDisplayObject) => void;
  /**
   * 可选：提供 DOM overlay，用于 ECharts 等纯 DOM 渲染场景
   */
  createOverlay?: (node: NodeState) => OverlayInstance;
  updateOverlay?: (overlay: OverlayInstance, node: NodeState) => void;
  destroyOverlay?: (overlay: OverlayInstance, node: NodeState) => void;
  /**
   * 是否支持手动调整尺寸（默认 true）
   * false = 组件根据内容自适应尺寸
   */
  resizable?: boolean;
};


