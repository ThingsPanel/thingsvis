import type { NodeState } from '@thingsvis/kernel';

export type LeaferDisplayObject = {
  set?: (props: Record<string, unknown>) => void;
  remove?: () => void;
  on?: (event: string, cb: () => void) => void;
  x?: number;
  y?: number;
};

export type RendererFactory = {
  create: (node: NodeState) => LeaferDisplayObject;
  update: (instance: LeaferDisplayObject, node: NodeState) => void;
  destroy: (instance: LeaferDisplayObject) => void;
};


