import type { PluginMainModule, PluginOverlayContext } from '@thingsvis/schema';
import type { NodeState, KernelStore } from '@thingsvis/kernel';
import type { LeaferDisplayObject, RendererFactory } from './types';
import { Rect } from 'leafer-ui';
import { PropertyResolver } from '../PropertyResolver';

function nodeToLeaferProps(node: NodeState, store: KernelStore): Record<string, unknown> {
  const schema = node.schemaRef as any;
  const width = schema.size?.width ?? 0;
  const height = schema.size?.height ?? 0;
  const { x, y } = schema.position ?? { x: 0, y: 0 };
  
  // Use PropertyResolver to get final props
  const resolvedProps = PropertyResolver.resolve(node, store.getState().dataSources);
  
  return {
    x,
    y,
    width,
    height,
    ...resolvedProps
  };
}

/**
 * Check if an object is a valid Leafer display object.
 * We check for the presence of key Leafer properties/methods.
 */
function isLeaferDisplayObject(obj: unknown): obj is LeaferDisplayObject {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as any;
  // Leafer objects typically have these properties
  return typeof o.set === 'function' || typeof o.remove === 'function' || 
         (typeof o.tag === 'string') || (typeof o.__tag === 'string');
}

function nodeToOverlayContext(node: NodeState): PluginOverlayContext {
  const schema = node.schemaRef as any;
  return {
    position: schema.position,
    size: schema.size,
    props: schema.props
  };
}

export function createPluginRenderer(plugin: PluginMainModule, store: KernelStore): RendererFactory {
  return {
    create(node: NodeState): LeaferDisplayObject {
      const raw = plugin.create();
      
      // If the plugin returned a valid Leafer object, use it
      if (isLeaferDisplayObject(raw)) {
        raw.set?.(nodeToLeaferProps(node, store));
        return raw;
      }
      
      // If the plugin returned a DOM element, we'll use a placeholder Rect
      // The actual DOM rendering should be done via createOverlay
      if (raw instanceof HTMLElement) {
        console.warn(
          `[pluginRenderer] Plugin "${plugin.id}" returned a DOM element from create(). ` +
          `Please use createOverlay() for DOM-based rendering. Using placeholder.`
        );
      } else {
        console.warn(
          `[pluginRenderer] Plugin "${plugin.id}" returned an invalid object from create(). ` +
          `Expected a Leafer display object. Using placeholder.`
        );
      }
      
      // Create a placeholder Rect as fallback
      const props = nodeToLeaferProps(node, store);
      const placeholder = new Rect({
        x: props.x as number,
        y: props.y as number,
        width: props.width as number || 100,
        height: props.height as number || 60,
        fill: 'rgba(150, 150, 150, 0.3)',
        stroke: '#999',
        strokeWidth: 1,
        dashPattern: [4, 4],
        draggable: true,
        cursor: 'pointer'
      });
      return placeholder as unknown as LeaferDisplayObject;
    },
    update(instance: LeaferDisplayObject, node: NodeState) {
      instance.set?.(nodeToLeaferProps(node, store));
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


