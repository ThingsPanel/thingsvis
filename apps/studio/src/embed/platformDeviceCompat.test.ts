import { describe, expect, it } from 'vitest';
import type { DataSource } from '@thingsvis/schema';
import {
  applyPlatformBufferSize,
  adoptLegacyPlatformDataSources,
  findLegacyPlatformDataSourceIdsForAdoption,
  getResolvedPlatformBufferSize,
  getPlatformDeviceDataSourceId,
  hasPlatformDataSourceBoundToDevice,
  inferSinglePlatformDeviceId,
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
  it('finds only legacy platform datasource ids for runtime adoption', () => {
    const dataSources: DataSource[] = [
      createPlatformDataSource('__platform__'),
      createPlatformDataSource('legacy-platform'),
      createPlatformDataSource(getPlatformDeviceDataSourceId('dev-1'), { deviceId: 'dev-1' }),
      {
        id: 'rest-1',
        name: 'rest-1',
        type: 'REST',
        config: { url: 'https://example.com' },
      } as unknown as DataSource,
    ];

    expect(findLegacyPlatformDataSourceIdsForAdoption(dataSources)).toEqual([
      '__platform__',
      'legacy-platform',
    ]);
  });

  it('adopts legacy datasource configs to the active runtime device', () => {
    const dataSources: DataSource[] = [
      createPlatformDataSource('__platform__'),
      createPlatformDataSource('legacy-platform', { deviceId: 'tpl-123' }),
      createPlatformDataSource(getPlatformDeviceDataSourceId('dev-9'), { deviceId: 'dev-9' }),
    ];

    const adopted = adoptLegacyPlatformDataSources(dataSources, 'dev-1');

    expect((adopted[0]!.config as any).deviceId).toBe('dev-1');
    expect((adopted[1]!.config as any).deviceId).toBe('dev-1');
    expect((adopted[2]!.config as any).deviceId).toBe('dev-9');
  });

  it('detects whether a datasource is already bound to the runtime device', () => {
    const dataSources: DataSource[] = [
      createPlatformDataSource('__platform__'),
      createPlatformDataSource('legacy-platform', { deviceId: 'dev-1' }),
    ];

    expect(hasPlatformDataSourceBoundToDevice(dataSources, 'dev-1')).toBe(true);
    expect(hasPlatformDataSourceBoundToDevice(dataSources, 'dev-2')).toBe(false);
  });

  it('infers a single runtime device id from legacy platform datasources', () => {
    expect(
      inferSinglePlatformDeviceId([
        createPlatformDataSource('__platform___template____', { deviceId: 'dev-1' }),
        createPlatformDataSource('legacy-platform', { deviceId: 'dev-1' }),
      ]),
    ).toBe('dev-1');

    expect(
      inferSinglePlatformDeviceId([
        createPlatformDataSource('__platform___template____', { deviceId: 'dev-1' }),
        createPlatformDataSource('legacy-platform', { deviceId: 'dev-2' }),
      ]),
    ).toBeNull();
  });

  it('normalizes and inherits platform buffer size from top-level init payload', () => {
    expect(normalizePlatformBufferSize(-10)).toBe(0);
    expect(normalizePlatformBufferSize(12.8)).toBe(12);

    expect(
      getResolvedPlatformBufferSize(
        [
          createPlatformDataSource('__platform__', { bufferSize: 20 }),
          createPlatformDataSource(getPlatformDeviceDataSourceId('dev-1'), { bufferSize: 5 }),
        ],
        8,
      ),
    ).toBe(20);

    expect(
      getResolvedPlatformBufferSize(
        [
          createPlatformDataSource('__platform__', { bufferSize: 0 }),
          createPlatformDataSource(getPlatformDeviceDataSourceId('dev-1'), { bufferSize: 0 }),
        ],
        30,
      ),
    ).toBe(30);
  });

  it('applies inherited buffer size to all platform datasources', () => {
    const updated = applyPlatformBufferSize(
      [
        createPlatformDataSource('__platform__', { bufferSize: 0 }),
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
