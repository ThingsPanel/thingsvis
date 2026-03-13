import type { WidgetMainModule, WidgetOverlayContext } from '@thingsvis/schema';
import type { NodeState, KernelStore } from '@thingsvis/kernel';
import type { LeaferDisplayObject, RendererFactory } from './types';
import { Rect } from 'leafer-ui';
import { PropertyResolver } from '../PropertyResolver';
import { buildEmit } from '../executeActions';
import type { EventBus } from '../EventBus';

/**
 * Extract the primary datasource's raw data for a given node.
 * "Primary" = the datasource referenced by the first DataBinding entry.
 * Returns undefined if the node has no bindings or the datasource has no data yet.
 */
function getPrimaryRawData(node: NodeState, dataSources: Record<string, any>): unknown {
  const bindings = (node.schemaRef as any).data;
  if (!Array.isArray(bindings) || bindings.length === 0) return undefined;
  const first = bindings[0];
  // dataSourcePath is like 'ds.myDsId.data' — take the second segment as the dsId
  if (first?.dataSourcePath && typeof first.dataSourcePath === 'string') {
    const parts = (first.dataSourcePath as string).split('.');
    const dsId = parts[1];
    if (dsId) return dataSources[dsId]?.data;
  }
  return undefined;
}

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

function nodeToOverlayContext(
  node: NodeState,
  store: KernelStore,
  opts?: { editable?: boolean },
  bus?: EventBus,
  // Per-node subscription tracker for automatic cleanup on widget destroy
  subscriptions?: Set<() => void>
): WidgetOverlayContext {
  const schema = node.schemaRef as any;
  // 使用 PropertyResolver 解析绑定表达式
  const resolvedProps = PropertyResolver.resolve(node, store.getState().dataSources, (store.getState() as any).variableValues);
  const mode: WidgetOverlayContext['mode'] = opts?.editable !== false ? 'edit' : 'view';
  return {
    position: schema.position,
    size: schema.size,
    props: resolvedProps,
    mode,
    locale: (typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en'),
    visible: true,
    emit: buildEmit(
      () => store.getState().nodesById[node.id]?.schemaRef,
      () => store.getState(),
      bus
    ),
    on: (event: string, handler: (payload?: unknown) => void) => {
      if (!bus) return () => {};
      const unsub = bus.on(event, handler);
      // Track so we can auto-unsubscribe when the overlay is destroyed
      subscriptions?.add(unsub);
      // Return a wrapped unsub that also removes from the tracker
      return () => {
        unsub();
        subscriptions?.delete(unsub);
      };
    },
  };
}

export function createWidgetRenderer(
  widget: WidgetMainModule,
  store: KernelStore,
  opts?: { editable?: boolean },
  bus?: EventBus
): RendererFactory {
  // Per-node subscription tracker: nodeId → Set of unsubscribe functions
  // Ensures all bus.on() calls are cleaned up when the overlay is destroyed.
  const nodeSubscriptions = new Map<string, Set<() => void>>();
  // 判断是否为纯 Overlay 组件（只有 createOverlay，没有 create）
  const isOverlayOnly = !widget.create && typeof widget.createOverlay === 'function';
  const resizable = (widget as any).resizable as boolean | undefined;
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
        // Allocate a per-node subscription set for automatic cleanup on destroy
        const subs = new Set<() => void>();
        nodeSubscriptions.set(node.id, subs);

        // 从 node 中提取 linkedNodes（如果存在）
        const linkedNodes = (node as any).linkedNodes;
        const context = nodeToOverlayContext(node, store, opts, bus, subs);
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
        // Apply transformData hook: pre-process primary datasource data before first render
        if (widget.transformData) {
          const rawData = getPrimaryRawData(node, store.getState().dataSources);
          (context as any).data = widget.transformData(rawData, context.props ?? {});
        }
        const overlay = widget.createOverlay!(context);
        if (opts?.editable !== false) {
          // 在编辑模式下，彻底禁用底层 DOM 元素的事件响应。
          // 否则在拖拽时 overlay 会因为 z-index 提升而遮挡 Moveable 的 proxy-layer 并吞噬事件。
          overlay.element.style.pointerEvents = 'none';
        }
        return {
          element: overlay.element,
          update: overlay.update
            ? (nextNode: NodeState) => {
              const nextLinkedNodes = (nextNode as any).linkedNodes;
              const nextContext = nodeToOverlayContext(nextNode, store, opts, bus, subs);
              if (nextLinkedNodes) {
                (nextContext as any).linkedNodes = nextLinkedNodes;
              }
              // Apply transformData hook before each update
              if (widget.transformData) {
                const rawData = getPrimaryRawData(nextNode, store.getState().dataSources);
                (nextContext as any).data = widget.transformData(rawData, nextContext.props ?? {});
              }
              overlay.update?.(nextContext);
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
    destroyOverlay: widget.createOverlay
      ? (overlay, node) => {
        // Auto-unsubscribe all bus.on() subscriptions registered by this node
        const subs = nodeSubscriptions.get(node.id);
        if (subs) {
          for (const unsub of subs) unsub();
          subs.clear();
          nodeSubscriptions.delete(node.id);
        }
        overlay.destroy?.();
      }
      : undefined
    ,
    // If widget metadata defines resizable=false, let VisualEngine treat it as auto-size.
    resizable
  };
}


