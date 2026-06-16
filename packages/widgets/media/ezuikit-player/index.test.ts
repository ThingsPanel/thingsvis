import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';
import { getTodayBeginTimestamp } from './src/ezopen';

const destroy = vi.fn();
const stop = vi.fn();
const changePlayUrl = vi.fn().mockResolvedValue(undefined);
const changeTheme = vi.fn();
const resize = vi.fn();

const playerCtor = vi.fn(function MockEZUIKitPlayer(this: {
  destroy: typeof destroy;
  stop: typeof stop;
  changePlayUrl: typeof changePlayUrl;
  changeTheme: typeof changeTheme;
  resize: typeof resize;
}) {
  this.destroy = destroy;
  this.stop = stop;
  this.changePlayUrl = changePlayUrl;
  this.changeTheme = changeTheme;
  this.resize = resize;
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
    changePlayUrl.mockClear();
    changeTheme.mockClear();
    resize.mockClear();
    vi.clearAllMocks();
  });

  it('shows empty guidance before token and source are configured', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, { locale: 'en' });
    expect(harness.element.textContent).toContain('Bind EZVIZ accessToken');
    expect(playerCtor).not.toHaveBeenCalled();
    harness.destroy();
  });

  it('creates EZUIKit player with hd live url when bound url is hd cloud recording', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      locale: 'en',
      mode: 'view',
      props: {
        accessToken: 'at.test-token',
        deviceSerial: 'BC7900686',
        channelNo: 1,
        hd: true,
        template: 'security',
      },
    });

    await vi.waitFor(() => {
      expect(playerCtor).toHaveBeenCalled();
    });

    const options = playerCtor.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(options.accessToken).toBe('at.test-token');
    expect(options.url).toBe('ezopen://open.ys7.com/BC7900686/1.hd.live');
    expect(options.template).toBe('security');

    harness.destroy();
    expect(destroy).toHaveBeenCalled();
  });

  it('still supports legacy ezopen url fallback', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      locale: 'en',
      mode: 'view',
      props: {
        accessToken: 'at.test-token',
        ezopenUrl:
          'ezopen://open.ys7.com/BC7900686/1.hd.cloud.rec?begin=20260616000000&end=20260616235959',
        template: 'security',
      },
    });

    await vi.waitFor(() => {
      expect(playerCtor).toHaveBeenCalled();
    });

    const options = playerCtor.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(options.url).toBe('ezopen://open.ys7.com/BC7900686/1.hd.live');

    harness.destroy();
  });

  it('does not recreate the player when only the host size changes', async () => {
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      locale: 'en',
      mode: 'view',
      size: { width: 320, height: 240 },
      props: {
        accessToken: 'at.test-token',
        deviceSerial: 'BC7900686',
        channelNo: 1,
        hd: true,
        template: 'security',
      },
    });

    await vi.waitFor(() => {
      expect(playerCtor).toHaveBeenCalledTimes(1);
    });

    harness.update({ size: { width: 900, height: 360 } });
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(playerCtor).toHaveBeenCalledTimes(1);
    harness.destroy();
  });

  it('uses cloud.rec ezopen url and pcRec theme when entering playback', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-16T12:00:00'));
    const { default: Main } = await import('./src/index');
    const harness = mountWidget(Main, {
      locale: 'en',
      mode: 'view',
      props: {
        accessToken: 'at.test-token',
        deviceSerial: 'BC7900686',
        channelNo: 1,
        hd: true,
        spaceId: '361254',
        template: 'security',
      },
    });

    await vi.waitFor(() => {
      expect(playerCtor).toHaveBeenCalledTimes(1);
    });

    const initOptions = playerCtor.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(initOptions.spaceId).toBe('361254');

    const playbackButton = Array.from(harness.element.querySelectorAll('button')).find(
      (button) => button.textContent === 'Playback',
    );
    playbackButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await vi.waitFor(() => {
      expect(changePlayUrl).toHaveBeenCalled();
    });

    expect(changePlayUrl.mock.calls[0]?.[0]).toEqual({
      url: `ezopen://open.ys7.com/BC7900686/1.cloud.rec?begin=${getTodayBeginTimestamp()}&end=20260616010000&spaceId=361254&busType=7`,
      accessToken: 'at.test-token',
    });
    expect(changeTheme).toHaveBeenCalledWith('pcRec');
    expect(playerCtor).toHaveBeenCalledTimes(1);

    vi.setSystemTime(Date.now() + 1500);
    const liveButton = Array.from(harness.element.querySelectorAll('button')).find(
      (button) => button.textContent === 'Live',
    );
    liveButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await vi.waitFor(() => {
      expect(changePlayUrl).toHaveBeenCalledTimes(2);
    });
    expect(changePlayUrl.mock.calls[1]?.[0]).toMatchObject({
      type: 'live',
      deviceSerial: 'BC7900686',
      channelNo: 1,
      hd: true,
    });
    expect(changeTheme).toHaveBeenCalledWith('security');

    harness.destroy();
    vi.useRealTimers();
  });
});
