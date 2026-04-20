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

  it('triggers one post-mount update after the overlay element is connected', () => {
    const renderSpy = vi.fn();
    const updateSpy = vi.fn();
    const frameQueue: FrameRequestCallback[] = [];
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback) => {
        frameQueue.push(callback);
        return frameQueue.length;
      });
    const cancelAnimationFrameSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    const themeWidget = defineWidget({
      id: 'test/post-mount-sync',
      name: 'Post Mount Sync',
      schema: z.object({
        label: z.string().default(''),
      }),
      render: (element) => {
        renderSpy(element.isConnected);
        return {
          update: () => {
            updateSpy(element.isConnected);
          },
        };
      },
    });

    const instance = themeWidget.createOverlay?.({
      props: {},
      emit: vi.fn(),
    });

    expect(instance).toBeTruthy();
    expect(renderSpy).toHaveBeenCalledWith(false);
    expect(updateSpy).not.toHaveBeenCalled();

    const host = document.createElement('div');
    host.setAttribute('data-canvas-theme', 'ember');
    document.body.appendChild(host);
    host.appendChild(instance!.element);

    expect(frameQueue).toHaveLength(1);
    frameQueue.shift()?.(16.7);

    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledWith(true);

    instance!.destroy?.();
    host.remove();
    requestAnimationFrameSpy.mockRestore();
    cancelAnimationFrameSpy.mockRestore();
  });

  it('returns preview defaults and sample data as widget metadata', () => {
    const previewWidget = defineWidget({
      id: 'test/preview-contract',
      name: 'Preview Contract',
      schema: z.object({
        label: z.string().default(''),
      }),
      previewDefaults: { label: 'Preview' },
      sampleData: { data: [{ value: 1 }] },
      render: () => ({}),
    });

    expect(previewWidget.previewDefaults).toEqual({ label: 'Preview' });
    expect(previewWidget.sampleData).toEqual({ data: [{ value: 1 }] });
  });
});
