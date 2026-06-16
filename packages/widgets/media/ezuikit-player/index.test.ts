import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';

const destroy = vi.fn();
const stop = vi.fn();
const playerCtor = vi.fn(function MockEZUIKitPlayer(this: { destroy: typeof destroy; stop: typeof stop }) {
  this.destroy = destroy;
  this.stop = stop;
});

vi.mock('ezuikit-js', () => ({
  default: {
    EZUIKitPlayer: playerCtor,
  },
  EZUIKitPlayer: playerCtor,
}));

describe('media/ezuikit-player widget', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    playerCtor.mockClear();
    destroy.mockClear();
    vi.clearAllMocks();
  });

  it('shows empty guidance before token and source are configured', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, { locale: 'en' });
    expect(harness.element.textContent).toContain('Bind EZVIZ accessToken');
    expect(playerCtor).not.toHaveBeenCalled();
    harness.destroy();
  });

  it('creates EZUIKit player in view mode when token and ezopen url are set', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      locale: 'en',
      mode: 'view',
      props: {
        accessToken: 'at.test-token',
        ezopenUrl: 'ezopen://open.ys7.com/BC7900686/1.live',
        template: 'security',
      },
    });

    await vi.waitFor(() => {
      expect(playerCtor).toHaveBeenCalled();
    });

    const options = playerCtor.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(options.accessToken).toBe('at.test-token');
    expect(options.url).toBe('ezopen://open.ys7.com/BC7900686/1.live');
    expect(options.template).toBe('security');

    harness.destroy();
    expect(destroy).toHaveBeenCalled();
  });

  it('switches to cloud recording playback from the built-in selector', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      locale: 'en',
      mode: 'view',
      props: {
        accessToken: 'at.test-token',
        deviceSerial: 'J33497314',
        channelNo: 1,
        template: 'security',
      },
    });

    await vi.waitFor(() => {
      expect(playerCtor).toHaveBeenCalledTimes(1);
    });

    const playbackButton = Array.from(harness.element.querySelectorAll('button')).find(
      (button) => button.textContent === 'Playback',
    );
    playbackButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const [startInput, endInput] = Array.from(
      harness.element.querySelectorAll('input[type="datetime-local"]'),
    ) as HTMLInputElement[];
    startInput.value = '2026-06-15T00:00';
    endInput.value = '2026-06-15T09:34';

    const playButton = Array.from(harness.element.querySelectorAll('button')).find(
      (button) => button.textContent === 'Play',
    );
    playButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await vi.waitFor(() => {
      expect(playerCtor).toHaveBeenCalledTimes(2);
    });

    const options = playerCtor.mock.calls[1]?.[0] as Record<string, unknown>;
    expect(options.url).toBe(
      'ezopen://open.ys7.com/J33497314/1.cloud.rec?begin=20260615000000&end=20260615093400',
    );

    harness.destroy();
  });

  it('recreates the player when the host size changes after mount', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      locale: 'en',
      mode: 'view',
      size: { width: 320, height: 240 },
      props: {
        accessToken: 'at.test-token',
        ezopenUrl: 'ezopen://open.ys7.com/BC7900686/1.live',
        template: 'security',
      },
    });

    await vi.waitFor(() => {
      expect(playerCtor).toHaveBeenCalledTimes(1);
    });
    expect((playerCtor.mock.calls[0]?.[0] as Record<string, unknown>).width).toBe(320);

    harness.update({ size: { width: 900, height: 360 } });

    await vi.waitFor(() => {
      expect(playerCtor).toHaveBeenCalledTimes(2);
    });
    const options = playerCtor.mock.calls[1]?.[0] as Record<string, unknown>;
    expect(options.width).toBe(900);
    expect(options.height).toBe(360);

    harness.destroy();
  });
});
