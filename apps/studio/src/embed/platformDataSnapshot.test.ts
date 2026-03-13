import { describe, expect, it, vi } from 'vitest';
import {
  buildPlatformReplayPayloads,
  cachePlatformData,
  type PlatformDataSnapshot,
} from './platformDataSnapshot';

describe('platformDataSnapshot', () => {
  it('caches single-field and bulk platform payloads by device scope', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-13T08:00:00.000Z'));

    let snapshot: PlatformDataSnapshot = {};

    snapshot = cachePlatformData(snapshot, {
      fieldId: 'temperature',
      value: 26.5,
      deviceId: 'dev-1',
    });

    snapshot = cachePlatformData(snapshot, {
      fields: {
        humidity: 60,
        pressure: 101.2,
      },
      timestamp: Date.parse('2026-03-13T08:00:01.000Z'),
    });

    expect(snapshot).toEqual({
      'dev-1': {
        temperature: { value: 26.5, timestamp: Date.parse('2026-03-13T08:00:00.000Z') },
      },
      __global__: {
        humidity: { value: 60, timestamp: Date.parse('2026-03-13T08:00:01.000Z') },
        pressure: { value: 101.2, timestamp: Date.parse('2026-03-13T08:00:01.000Z') },
      },
    });

    vi.useRealTimers();
  });

  it('builds replay payloads ordered by timestamp', () => {
    const replayPayloads = buildPlatformReplayPayloads({
      __global__: {
        humidity: { value: 60, timestamp: 20 },
      },
      'dev-1': {
        temperature: { value: 26.5, timestamp: 10 },
      },
    });

    expect(replayPayloads).toEqual([
      { fieldId: 'temperature', value: 26.5, timestamp: 10, deviceId: 'dev-1' },
      { fieldId: 'humidity', value: 60, timestamp: 20, deviceId: undefined },
    ]);
  });
});
