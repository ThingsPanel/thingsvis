import type { DataSource, PlatformFieldConfig } from '@thingsvis/schema';

function normalizeDataSourceType(type: unknown): string {
  return typeof type === 'string' ? type.toUpperCase() : '';
}

export function isPlatformFieldDataSource(dataSource: Pick<DataSource, 'type'>): boolean {
  const normalizedType = normalizeDataSourceType(dataSource.type);
  return normalizedType === 'PLATFORM_FIELD' || normalizedType === 'PLATFORM';
}

export function normalizePlatformBufferSize(bufferSize: unknown): number {
  if (typeof bufferSize !== 'number' || !Number.isFinite(bufferSize)) return 0;
  return Math.max(0, Math.trunc(bufferSize));
}

export function getResolvedPlatformBufferSize(
  dataSources: DataSource[],
  fallbackBufferSize?: unknown,
): number {
  return Math.max(
    normalizePlatformBufferSize(fallbackBufferSize),
    ...dataSources
      .filter((dataSource) => isPlatformFieldDataSource(dataSource))
      .map((dataSource) => {
        const config = (dataSource.config ?? {}) as PlatformFieldConfig;
        return normalizePlatformBufferSize(config.bufferSize);
      }),
  );
}

export function applyPlatformBufferSize(
  dataSources: DataSource[],
  fallbackBufferSize?: unknown,
): DataSource[] {
  const resolvedBufferSize = getResolvedPlatformBufferSize(dataSources, fallbackBufferSize);
  return dataSources.map((dataSource) => {
    if (!isPlatformFieldDataSource(dataSource)) return dataSource;

    const config = (dataSource.config ?? {}) as PlatformFieldConfig;
    return {
      ...dataSource,
      config: {
        ...config,
        bufferSize: Math.max(normalizePlatformBufferSize(config.bufferSize), resolvedBufferSize),
      },
    } as DataSource;
  });
}

export function getPlatformDeviceDataSourceId(deviceId: string): string {
  return `__platform_${deviceId}__`;
}

export function isCanonicalPlatformDeviceDataSourceId(dataSourceId: string): boolean {
  return /^__platform_(.+)__$/.test(dataSourceId);
}
