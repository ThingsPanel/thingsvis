import type { WidgetMainModule, WidgetOverlayContext } from '@thingsvis/widget-sdk';

export type WidgetHarness = {
  ctx: WidgetOverlayContext;
  widget: WidgetMainModule;
  element: HTMLElement;
  update: (next?: Partial<WidgetOverlayContext>) => void;
  destroy: () => void;
};

function syncElementSize(element: HTMLElement, size?: { width?: number; height?: number }) {
  const width = Math.max(1, Math.round(Number(size?.width ?? 320)));
  const height = Math.max(1, Math.round(Number(size?.height ?? 180)));

  element.style.width = `${width}px`;
  element.style.height = `${height}px`;

  Object.defineProperties(element, {
    clientWidth: {
      configurable: true,
      get: () => width,
    },
    clientHeight: {
      configurable: true,
      get: () => height,
    },
    offsetWidth: {
      configurable: true,
      get: () => width,
    },
    offsetHeight: {
      configurable: true,
      get: () => height,
    },
  });

  element.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      width,
      height,
      toJSON: () => ({}),
    }) as DOMRect;
}

export function mountWidget(
  widget: WidgetMainModule,
  overrides: Partial<WidgetOverlayContext> = {},
): WidgetHarness {
  if (typeof widget.createOverlay !== 'function') {
    throw new Error(`Widget "${widget.id}" does not expose createOverlay().`);
  }

  const ctx: WidgetOverlayContext = {
    id: `${widget.id}-test`,
    locale: 'en',
    mode: 'edit',
    position: { x: 0, y: 0 },
    size: { width: 320, height: 180 },
    props: {},
    ...overrides,
  };

  const instance = widget.createOverlay(ctx);
  syncElementSize(instance.element, ctx.size);
  document.body.appendChild(instance.element);

  return {
    ctx,
    widget,
    element: instance.element,
    update: (next = {}) => {
      const merged: WidgetOverlayContext = {
        ...ctx,
        ...next,
        props: {
          ...(ctx.props ?? {}),
          ...(next.props ?? {}),
        },
      };
      syncElementSize(instance.element, merged.size);
      instance.update?.(merged);
      Object.assign(ctx, merged);
    },
    destroy: () => {
      instance.destroy?.();
      instance.element.remove();
    },
  };
}
