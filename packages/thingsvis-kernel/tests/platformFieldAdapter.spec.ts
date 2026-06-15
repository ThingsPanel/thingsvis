import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlatformFieldAdapter } from '../src/datasources/PlatformFieldAdapter';
import type { DataSource } from '@thingsvis/schema';

function makePlatformDataSource(): DataSource {
  return {
    id: '__platform_device__',
    name: 'Platform Device',
    type: 'PLATFORM_FIELD',
    config: {
      source: 'platform',
      deviceId: 'device-1',
      fieldMappings: {},
      requestedFields: ['playback'],
      bufferSize: 0,
    },
  } as DataSource;
}

describe('PlatformFieldAdapter write normalization', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('unwraps legacy command values that contain duplicated method and params', async () => {
    vi.useFakeTimers();
    const postMessage = vi.fn();
    vi.stubGlobal('window', {
      parent: { postMessage },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const adapter = new PlatformFieldAdapter();
    await adapter.connect(makePlatformDataSource());

    void adapter.write({
      playback: {
        method: 'playback',
        params: {
          type: 'cloud',
          channel_no: 1,
          start_time: 1718000000,
          end_time: 1718080000,
        },
      },
    });

    const writeMessage = postMessage.mock.calls
      .map((call) => call[0])
      .find((message) => message?.type === 'tv:platform-write');

    expect(writeMessage?.payload?.data).toEqual({
      playback: {
        type: 'cloud',
        channel_no: 1,
        start_time: 1718000000,
        end_time: 1718080000,
      },
    });

    await adapter.disconnect();
  });
});
