import type { WidgetMainModule, WidgetOverlayContext } from '@thingsvis/widget-sdk';

export type WidgetHarness = {
  ctx: WidgetOverlayContext;
  widget: WidgetMainModule;
  element: HTMLElement;
  update: (next?: Partial<WidgetOverlayContext>) => void;
  destroy: () => void;
};

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
      instance.update?.(merged);
      Object.assign(ctx, merged);
    },
    destroy: () => {
      instance.destroy?.();
      instance.element.remove();
    },
  };
}
