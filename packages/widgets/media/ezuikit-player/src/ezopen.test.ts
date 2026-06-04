import { describe, expect, it } from 'vitest';
import { buildEzopenUrl } from './ezopen';
import { getDefaultProps } from './schema';

describe('ezopen url builder', () => {
  it('prefers a bound ezopen url when provided', () => {
    const url = buildEzopenUrl({
      ...getDefaultProps(),
      ezopenUrl: 'ezopen://open.ys7.com/ABC123/1.live',
      deviceSerial: 'IGNORED',
    });
    expect(url).toBe('ezopen://open.ys7.com/ABC123/1.live');
  });

  it('builds live and recording urls from device serial', () => {
    const live = buildEzopenUrl({
      ...getDefaultProps(),
      deviceSerial: 'BC7900686',
      channelNo: 2,
      streamSuffix: 'live',
    });
    expect(live).toBe('ezopen://open.ys7.com/BC7900686/2.live');

    const rec = buildEzopenUrl({
      ...getDefaultProps(),
      deviceSerial: 'BC7900686',
      channelNo: 1,
      streamSuffix: 'rec',
      playbackBegin: '20260604080000',
      playbackEnd: '20260604090000',
    });
    expect(rec).toContain('.rec?begin=20260604080000');
    expect(rec).toContain('end=20260604090000');
  });
});
