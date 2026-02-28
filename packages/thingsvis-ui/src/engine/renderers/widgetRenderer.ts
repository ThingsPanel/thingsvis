import type { WidgetMainModule, WidgetOverlayContext } from '@thingsvis/schema';
import type { NodeState, KernelStore } from '@thingsvis/kernel';
import type { LeaferDisplayObject, RendererFactory } from './types';
import { Rect } from 'leafer-ui';
import { PropertyResolver } from '../PropertyResolver';

function nodeToLeaferProps(node: NodeState, store: KernelStore): Record<string, unknown> {
  const schema = node.schemaRef as any;
  const width = schema.size?.width ?? 0;
  const height = schema.size?.height ?? 0;
  const { x, y } = schema.position ?? { x: 0, y: 0 };

  // Only return position/size for Leafer placeholder
  // Visual props (fill, stroke, etc.) are handled by DOM overlay
  return {
    x,
    y,
    width,
    height,
    fill: 'transparent', // Always keep placeholder transparent
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

function nodeToOverlayContext(node: NodeState, store: KernelStore, opts?: { editable?: boolean }): WidgetOverlayContext {
  const schema = node.schemaRef as any;
  // 使用 PropertyResolver 解析绑定表达式
  const resolvedProps = PropertyResolver.resolve(node, store.getState().dataSources);
  const mode: WidgetOverlayContext['mode'] = opts?.editable !== false ? 'edit' : 'view';
  // eslint-disable-next-line no-console
  console.log('[widgetRenderer] nodeToOverlayContext', { nodeId: node.id, editable: opts?.editable, mode });
  return {
    position: schema.position,
    size: schema.size,
    props: resolvedProps,
    mode,
    locale: (typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en'),
    visible: true,
    emit: (event: string, payload?: unknown) => {
      // Handle inline editing events from widgets
      if (event === 'edit:start') {
        store.getState().setEditingNode(node.id);
      } else if (event === 'edit:end') {
        const editPayload = payload as { text?: string; changed?: boolean; cancelled?: boolean } | undefined;
        // Update node props if text changed
        if (editPayload?.changed && editPayload.text !== undefined) {
          store.getState().updateNode(node.id, {
            props: { ...schema.props, text: editPayload.text }
          });
        }
        // Clear editing state
        store.getState().setEditingNode(null);
      }
    },
    on: (_event: string, _handler: (payload?: unknown) => void) => () => {},
  };
}

export function createWidgetRenderer(widget: WidgetMainModule, store: KernelStore, opts?: { editable?: boolean }): RendererFactory {
  // 判断是否为纯 Overlay 组件（只有 createOverlay，没有 create）
  const isOverlayOnly = !widget.create && typeof widget.createOverlay === 'function';
  // 从 widget metadata 中读取 resizable 属性（默认为 true）
  const resizable = widget.resizable !== false;
  const draggable = opts?.editable ?? true;
  const cursor = draggable ? 'pointer' : 'default';

  return {
    create(node: NodeState): LeaferDisplayObject {
      // 对于纯 Overlay 组件，创建一个透明占位 Rect（实际渲染由 Overlay 处理）
      if (isOverlayOnly) {
        const props = nodeToLeaferProps(node, store);
        const placeholder = new Rect({
          x: props.x as number,
          y: props.y as number,
          width: props.width as number || 100,
          height: props.height as number || 60,
          fill: 'transparent',
          draggable,
          cursor
        });
        return placeholder as unknown as LeaferDisplayObject;
      }

      const raw = widget.create!();

      // If the widget returned a valid Leafer object, use it
      if (isLeaferDisplayObject(raw)) {
        raw.set?.(nodeToLeaferProps(node, store));
        return raw;
      }

      // If the widget returned a DOM element, we'll use a placeholder Rect
      // The actual DOM rendering should be done via createOverlay
      if (raw instanceof HTMLElement) {

      } else {

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
        draggable,
        cursor
      });
      return placeholder as unknown as LeaferDisplayObject;
    },
    update(instance: LeaferDisplayObject, node: NodeState) {
      instance.set?.(nodeToLeaferProps(node, store));
    },
    destroy(instance: LeaferDisplayObject) {
      instance.remove?.();
    },
    createOverlay: widget.createOverlay
      ? (node: NodeState) => {
        // 从 node 中提取 linkedNodes（如果存在）
        const linkedNodes = (node as any).linkedNodes;
        const context = nodeToOverlayContext(node, store, opts);
        // 将 linkedNodes 附加到 context
        if (linkedNodes) {
          (context as any).linkedNodes = linkedNodes;
        }
        // 属性迁移：如果 widget.version 与保存的 widgetVersion 不匹配，调用 migrate
        const schema = node.schemaRef as any;
        const savedVersion = schema.widgetVersion;
        if (widget.migrate && context.props && savedVersion && widget.version && savedVersion !== widget.version) {
          context.props = widget.migrate(context.props, savedVersion) as Record<string, unknown>;
        }
        const overlay = widget.createOverlay!(context);
        if (opts?.editable !== false) {
          // 在编辑模式下，对于可调整尺寸的组件，禁用底层 DOM 元素的事件响应。
          // 否则在拖拽时 overlay 会因为 z-index 提升而遮挡 Moveable 的 proxy-layer 并吞噬事件。
          // 但对于自适应尺寸组件（如文本），保留事件响应以支持双击编辑等功能。
          if (resizable) {
            overlay.element.style.pointerEvents = 'none';
          } else {
            // 确保自适应尺寸组件可以接收事件（如双击编辑）
            overlay.element.style.pointerEvents = 'auto';
          }
        }
        return {
          element: overlay.element,
          update: overlay.update
            ? (nextNode: NodeState, nextContext?: WidgetOverlayContext) => {
              // If context is provided (from VisualEngine), use it; otherwise create new context
              const context = nextContext ?? nodeToOverlayContext(nextNode, store, opts);
              const nextLinkedNodes = (nextNode as any).linkedNodes;
              if (nextLinkedNodes) {
                (context as any).linkedNodes = nextLinkedNodes;
              }
              overlay.update?.(context);
            }
            : undefined,
          destroy: overlay.destroy
        };
      }
      : undefined,
    updateOverlay: widget.createOverlay
      ? (overlay, node) => {
        // 直接调用已包装的 update，它会处理 linkedNodes
        overlay.update?.(node);
      }
      : undefined,
    destroyOverlay: widget.createOverlay ? overlay => overlay.destroy?.() : undefined
    ,
    // If widget metadata defines resizable=false, let VisualEngine treat it as auto-size.
    resizable
  };
}


