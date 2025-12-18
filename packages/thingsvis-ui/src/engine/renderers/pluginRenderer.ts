import type { PluginMainModule, PluginOverlayContext } from '@thingsvis/schema';
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

function nodeToOverlayContext(node: NodeState): PluginOverlayContext {
  const schema = node.schemaRef as any;
  return {
    position: schema.position,
    size: schema.size,
    props: schema.props
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
    },
    createOverlay: plugin.createOverlay
      ? (node: NodeState) => {
          const overlay = plugin.createOverlay!(nodeToOverlayContext(node));
          return {
            element: overlay.element,
            update: overlay.update
              ? (nextNode: NodeState) => overlay.update?.(nodeToOverlayContext(nextNode))
              : undefined,
            destroy: overlay.destroy
          };
        }
      : undefined,
    updateOverlay: plugin.createOverlay
      ? (overlay, node) => overlay.update?.(node)
      : undefined,
    destroyOverlay: plugin.createOverlay ? overlay => overlay.destroy?.() : undefined
  };
}


