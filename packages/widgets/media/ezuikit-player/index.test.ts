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
});
