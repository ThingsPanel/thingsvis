import { describe, expect, it } from 'vitest';
import type { DataSource } from '@thingsvis/schema';
import {
  applyPlatformBufferSize,
  getResolvedPlatformBufferSize,
  getPlatformDeviceDataSourceId,
  normalizePlatformBufferSize,
} from './platformDeviceCompat';

function createPlatformDataSource(id: string, config: Record<string, unknown> = {}): DataSource {
  return {
    id,
    name: id,
    type: 'PLATFORM_FIELD',
    config: {
      source: 'platform',
      fieldMappings: {},
      bufferSize: 0,
      ...config,
    },
  };
}

describe('platformDeviceCompat', () => {
  it('normalizes and inherits platform buffer size from top-level init payload', () => {
    expect(normalizePlatformBufferSize(-10)).toBe(0);
    expect(normalizePlatformBufferSize(12.8)).toBe(12);

    expect(
      getResolvedPlatformBufferSize(
        [
          createPlatformDataSource(getPlatformDeviceDataSourceId('dev-2'), { bufferSize: 20 }),
          createPlatformDataSource(getPlatformDeviceDataSourceId('dev-1'), { bufferSize: 5 }),
        ],
        8,
      ),
    ).toBe(20);

    expect(
      getResolvedPlatformBufferSize(
        [
          createPlatformDataSource(getPlatformDeviceDataSourceId('dev-2'), { bufferSize: 0 }),
          createPlatformDataSource(getPlatformDeviceDataSourceId('dev-1'), { bufferSize: 0 }),
        ],
        30,
      ),
    ).toBe(30);
  });

  it('applies inherited buffer size to all platform datasources', () => {
    const updated = applyPlatformBufferSize(
      [
        createPlatformDataSource(getPlatformDeviceDataSourceId('dev-2'), { bufferSize: 0 }),
        createPlatformDataSource(getPlatformDeviceDataSourceId('dev-1'), { bufferSize: 12 }),
        {
          id: 'rest-1',
          name: 'rest-1',
          type: 'REST',
          config: { url: 'https://example.com' },
        } as unknown as DataSource,
      ],
      24,
    );

    expect((updated[0]!.config as any).bufferSize).toBe(24);
    expect((updated[1]!.config as any).bufferSize).toBe(24);
    expect((updated[2]!.config as any).url).toBe('https://example.com');
  });
});
