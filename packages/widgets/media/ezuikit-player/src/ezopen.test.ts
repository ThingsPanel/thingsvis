import { describe, expect, it } from 'vitest';

import {
  buildPlaybackEzopenUrl,
  buildLiveEzopenUrl,
  getDefaultRecEndTimestamp,
  getTodayBeginTimestamp,
  isPlayerConfigured,
  parseCloudRecQuery,
  parseEzopenSource,
  resolvePlaybackParams,
  resolveDeviceSource,
  resolveInitLiveUrl,
  resolveSpaceId,
} from './ezopen';

import { getDefaultProps } from './schema';

describe('ezopen url builder', () => {
  it('builds source from device serial and channel without ezopen url', () => {
    const source = resolveDeviceSource({
      ...getDefaultProps(),

      deviceSerial: 'J33497314',

      channelNo: 1,

      hd: true,
    });

    expect(source).toEqual({ serial: 'J33497314', channel: 1, hd: true });

    expect(
      resolveInitLiveUrl({
        ...getDefaultProps(),

        deviceSerial: 'J33497314',

        channelNo: 1,

        hd: true,
      }),
    ).toBe('ezopen://open.ys7.com/J33497314/1.hd.live');

    expect(
      isPlayerConfigured({
        ...getDefaultProps(),

        accessToken: 'at.test',

        deviceSerial: 'J33497314',

        channelNo: 1,
      }),
    ).toBe(true);
  });

  it('prefers device serial over legacy ezopen url binding', () => {
    const source = resolveDeviceSource({
      ...getDefaultProps(),

      deviceSerial: 'J33497314',

      channelNo: 1,

      hd: true,

      ezopenUrl: 'ezopen://open.ys7.com/OTHER/2.live',
    });

    expect(source).toEqual({ serial: 'J33497314', channel: 1, hd: true });
  });

  it('parses serial, channel and hd flag from cloud recording urls', () => {
    const source = parseEzopenSource(
      'ezopen://open.ys7.com/J33497314/1.hd.cloud.rec?begin=20260616000000&end=20260616235959',
    );

    expect(source).toEqual({ serial: 'J33497314', channel: 1, hd: true });
  });

  it('always resolves init url to live preview', () => {
    const url = resolveInitLiveUrl({
      ...getDefaultProps(),

      ezopenUrl:
        'ezopen://open.ys7.com/J33497314/1.hd.cloud.rec?begin=20260616000000&end=20260616235959',
    });

    expect(url).toBe('ezopen://open.ys7.com/J33497314/1.hd.live');
  });

  it('builds sd card playback url with begin only', () => {
    expect(
      buildPlaybackEzopenUrl(
        { serial: 'J33497314', channel: 1, hd: true },
        { mode: 'sd', begin: '20260616000000' },
      ),
    ).toBe('ezopen://open.ys7.com/J33497314/1.rec?begin=20260616000000');
  });

  it('builds cloud recording url with spaceId, busType, begin and end', () => {
    expect(
      buildPlaybackEzopenUrl(
        { serial: 'J33497314', channel: 1, hd: true },
        {
          mode: 'cloud',
          begin: '20260616000000',

          end: '20260616010000',

          spaceId: '361254',

          busType: '7',
        },
      ),
    ).toBe(
      'ezopen://open.ys7.com/J33497314/1.cloud.rec?begin=20260616000000&end=20260616010000&spaceId=361254&busType=7',
    );
  });

  it('parses spaceId from playback hint url', () => {
    const hint =
      'ezopen://open.ys7.com/J33497314/1.cloud.rec?begin=20260616000000&end=20260616010000&spaceId=361254&busType=7';

    expect(parseCloudRecQuery(hint)).toEqual({
      begin: '20260616000000',

      end: '20260616010000',

      spaceId: '361254',

      busType: '7',
    });

    expect(
      resolveSpaceId({
        ...getDefaultProps(),

        playbackParamsUrl: hint,
      }),
    ).toBe('361254');

    expect(
      resolvePlaybackParams({
        ...getDefaultProps(),
        playbackMode: 'cloud',
        playbackParamsUrl: hint,
      }),
    ).toEqual({
      mode: 'cloud',
      begin: '20260616000000',

      end: '20260616010000',

      spaceId: '361254',

      busType: '7',
    });
  });

  it('builds sd cloud recording url without hd suffix', () => {
    expect(buildLiveEzopenUrl({ serial: 'ABC123', channel: 2, hd: false })).toBe(
      'ezopen://open.ys7.com/ABC123/2.live',
    );
  });

  it('formats today begin timestamp as YYYYMMDD000000', () => {
    expect(getTodayBeginTimestamp(new Date('2026-06-16T19:30:00'))).toBe('20260616000000');
  });

  it('defaults end timestamp to one hour after begin', () => {
    expect(getDefaultRecEndTimestamp('20260616000000')).toBe('20260616010000');
  });
});
