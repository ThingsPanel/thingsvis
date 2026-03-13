import type { NodeState } from '@thingsvis/kernel';
import { Rect } from 'leafer-ui';
import type { RendererFactory } from './types';

export const errorRenderer: RendererFactory = {
  create(node: NodeState) {
    const schema = node.schemaRef as any;
    const width = schema.size?.width ?? 120;
    const height = schema.size?.height ?? 40;
    const { x, y } = schema.position ?? { x: 0, y: 0 };
    return new Rect({
      x,
      y,
      width,
      height,
      fill: '#ff4d4f',
      opacity: 0.7
    });
  },
  update(instance: any, node: NodeState) {
    const schema = node.schemaRef as any;
    const width = schema.size?.width ?? 120;
    const height = schema.size?.height ?? 40;
    const { x, y } = schema.position ?? { x: 0, y: 0 };
    instance.set?.({ x, y, width, height });
  },
  destroy(instance: any) {
    instance.remove?.();
  }
};


