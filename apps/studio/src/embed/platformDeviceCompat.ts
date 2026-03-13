import type { DataSource, PlatformFieldConfig } from '@thingsvis/schema';

function normalizeDataSourceType(type: unknown): string {
  return typeof type === 'string' ? type.toUpperCase() : '';
}

export function isPlatformFieldDataSource(dataSource: Pick<DataSource, 'type'>): boolean {
  const normalizedType = normalizeDataSourceType(dataSource.type);
  return normalizedType === 'PLATFORM_FIELD' || normalizedType === 'PLATFORM';
}

export function getPlatformDeviceDataSourceId(deviceId: string): string {
  return `__platform_${deviceId}__`;
}

export function isCanonicalPlatformDeviceDataSourceId(dataSourceId: string): boolean {
  return /^__platform_(.+)__$/.test(dataSourceId);
}

export function findLegacyPlatformDataSourceIdsForAdoption(dataSources: DataSource[]): string[] {
  return dataSources
    .filter((dataSource) => isPlatformFieldDataSource(dataSource))
    .filter((dataSource) => !isCanonicalPlatformDeviceDataSourceId(dataSource.id))
    .map((dataSource) => dataSource.id);
}

export function hasPlatformDataSourceBoundToDevice(
  dataSources: DataSource[],
  deviceId: string,
): boolean {
  return dataSources.some((dataSource) => {
    if (!isPlatformFieldDataSource(dataSource)) return false;
    if (dataSource.id === getPlatformDeviceDataSourceId(deviceId)) return true;

    const config = (dataSource.config ?? {}) as PlatformFieldConfig;
    return config.deviceId === deviceId;
  });
}

export function inferSinglePlatformDeviceId(dataSources: DataSource[]): string | null {
  const deviceIds = new Set<string>();

  dataSources.forEach((dataSource) => {
    if (!isPlatformFieldDataSource(dataSource)) return;
    const config = (dataSource.config ?? {}) as PlatformFieldConfig;
    if (typeof config.deviceId === 'string' && config.deviceId.trim()) {
      deviceIds.add(config.deviceId);
    }
  });

  return deviceIds.size === 1 ? (Array.from(deviceIds)[0] ?? null) : null;
}

export function adoptLegacyPlatformDataSources(
  dataSources: DataSource[],
  deviceId: string,
): DataSource[] {
  return dataSources.map((dataSource) => {
    if (!isPlatformFieldDataSource(dataSource)) return dataSource;
    if (isCanonicalPlatformDeviceDataSourceId(dataSource.id)) return dataSource;

    const config = (dataSource.config ?? {}) as PlatformFieldConfig;
    return {
      ...dataSource,
      config: {
        ...config,
        deviceId,
      },
    } as DataSource;
  });
}
