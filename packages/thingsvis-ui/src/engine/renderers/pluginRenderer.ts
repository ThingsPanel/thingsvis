import type { PluginMainModule } from '@thingsvis/schema';
import type { NodeState } from '@thingsvis/kernel';
import type { LeaferDisplayObject, RendererFactory } from './types';

function nodeToLeaferProps(node: NodeState): Record<string, unknown> {
  const schema = node.schemaRef as any;
  const width = schema.size?.width ?? 0;
  const height = schema.size?.height ?? 0;
  const { x, y } = schema.position ?? { x: 0, y: 0 };
  const extra = (schema.props ?? {}) as Record<string, unknown>;
  return {
    x,
    y,
    width,
    height,
    ...extra
  };
}

export function createPluginRenderer(plugin: PluginMainModule): RendererFactory {
  return {
    create(node: NodeState): LeaferDisplayObject {
      const inst = plugin.create() as LeaferDisplayObject;
      inst.set?.(nodeToLeaferProps(node));
      return inst;
    },
    update(instance: LeaferDisplayObject, node: NodeState) {
      instance.set?.(nodeToLeaferProps(node));
    },
    destroy(instance: LeaferDisplayObject) {
      instance.remove?.();
    }
  };
}


