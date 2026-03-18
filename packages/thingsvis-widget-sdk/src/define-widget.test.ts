import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { defineWidget } from './define-widget';

describe('defineWidget createOverlay event bridge', () => {
  const widget = defineWidget({
    id: 'test/event-bridge',
    name: 'Event Bridge',
    schema: z.object({
      label: z.string().default(''),
    }),
    render: () => ({}),
  });

  it('forwards widget:emit events to ctx.emit', () => {
    const emit = vi.fn();
    const instance = widget.createOverlay?.({
      props: {},
      emit,
    });

    expect(instance).toBeTruthy();

    instance!.element.dispatchEvent(
      new CustomEvent('widget:emit', {
        detail: { event: 'click', data: { label: 'test' } },
        bubbles: true,
      }),
    );

    expect(emit).toHaveBeenCalledWith('click', { label: 'test' });
  });

  it('uses the latest ctx.emit after update and removes listeners on destroy', () => {
    const firstEmit = vi.fn();
    const secondEmit = vi.fn();
    const instance = widget.createOverlay?.({
      props: {},
      emit: firstEmit,
    });

    expect(instance).toBeTruthy();

    instance!.update?.({
      props: {},
      emit: secondEmit,
    });

    instance!.element.dispatchEvent(
      new CustomEvent('widget:emit', {
        detail: { event: 'change', data: 42 },
        bubbles: true,
      }),
    );

    expect(firstEmit).not.toHaveBeenCalled();
    expect(secondEmit).toHaveBeenCalledWith('change', 42);

    instance!.destroy?.();
    secondEmit.mockClear();

    instance!.element.dispatchEvent(
      new CustomEvent('widget:emit', {
        detail: { event: 'change', data: 99 },
        bubbles: true,
      }),
    );

    expect(secondEmit).not.toHaveBeenCalled();
  });
});
