import { describe, expect, it, vi } from 'vitest';
import { executeAction } from '../src/engine/executeActions';

describe('executeAction callWrite', () => {
  it('resolves dataSourceId and payload expressions before writing', () => {
    const writeDataSource = vi.fn(async () => ({ success: true }));

    executeAction(
      {
        type: 'callWrite',
        dataSourceId: '{{vars.targetDataSourceId}}',
        payload: '{"value": "{{payload}}"}',
      },
      {
        variableValues: { targetDataSourceId: 'platform-device-1' },
        dataSources: {},
      },
      true,
      { dataSourceManager: { writeDataSource } as any },
    );

    expect(writeDataSource).toHaveBeenCalledWith('platform-device-1', { value: 'true' });
  });

  it('normalizes legacy camera command expressions before writing', () => {
    const writeDataSource = vi.fn(async () => ({ success: true }));
    const playbackPayload = {
      type: 'cloud2',
      channel_no: 1,
      start_time: 1718000000,
      end_time: 1718080000,
    };

    executeAction(
      {
        type: 'callWrite',
        dataSourceId: 'platform-device-1',
        payload:
          '({ playback: { method: "playback", params: { type: "cloud2", channel_no: 1, start_time: Math.floor(new Date(payload.playback.start).getTime() / 1000), end_time: Math.floor(new Date(payload.playback.end).getTime() / 1000) } } })',
      },
      {
        variableValues: {},
        dataSources: {},
      },
      playbackPayload,
      { dataSourceManager: { writeDataSource } as any },
    );

    expect(writeDataSource).toHaveBeenCalledWith('platform-device-1', {
      playback: {
        type: 'cloud2',
        channel_no: 1,
        start_time: 1718000000,
        end_time: 1718080000,
      },
    });
  });
});
