import type { DataSource, PlatformFieldConfig } from '@thingsvis/schema';
import {
  getPlatformDeviceDataSourceId,
  isPlatformFieldDataSource,
  normalizePlatformBufferSize,
} from '@/embed/platformDeviceCompat';

export type DevicePresetSchema = {
  canvas?: Record<string, unknown>;
  nodes?: Array<Record<string, unknown>>;
  dataSources?: unknown[];
};

const GENERIC_PLATFORM_DATA_SOURCE_ID = '__platform__';
const GENERIC_PLATFORM_BINDING_RE = /\bds\.__platform__(?=\.data\b)/g;

function cloneValue<T>(value: T): T {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function rewriteBindingString(input: string, targetDataSourceId: string): string {
  if (input === GENERIC_PLATFORM_DATA_SOURCE_ID) {
    return targetDataSourceId;
  }

  return input.replace(GENERIC_PLATFORM_BINDING_RE, `ds.${targetDataSourceId}`);
}

function rewriteGenericPlatformBindings<T>(value: T, targetDataSourceId: string): T {
  if (typeof value === 'string') {
    return rewriteBindingString(value, targetDataSourceId) as T;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => rewriteGenericPlatformBindings(entry, targetDataSourceId)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        rewriteGenericPlatformBindings(entry, targetDataSourceId),
      ]),
    ) as T;
  }

  return value;
}

function normalizeRequestedFields(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const requestedFields = value.filter(
    (fieldId): fieldId is string => typeof fieldId === 'string' && fieldId.trim().length > 0,
  );
  return requestedFields.length > 0 ? Array.from(new Set(requestedFields)) : [];
}

function hydratePlatformDataSource(dataSource: DataSource, deviceId: string): DataSource {
  const targetDataSourceId = getPlatformDeviceDataSourceId(deviceId);
  const rewritten = rewriteGenericPlatformBindings(cloneValue(dataSource), targetDataSourceId);
  if (!isPlatformFieldDataSource(rewritten)) return rewritten;

  const config = (rewritten.config ?? {}) as PlatformFieldConfig;
  return {
    ...rewritten,
    id:
      rewritten.id === GENERIC_PLATFORM_DATA_SOURCE_ID ? targetDataSourceId : String(rewritten.id),
    type: 'PLATFORM_FIELD',
    config: {
      ...config,
      deviceId,
      bufferSize: normalizePlatformBufferSize(config.bufferSize),
      ...(normalizeRequestedFields(config.requestedFields) !== undefined
        ? { requestedFields: normalizeRequestedFields(config.requestedFields) }
        : {}),
    },
  } as DataSource;
}

export function hydrateDevicePresetWidget(
  widget: Record<string, unknown>,
  deviceId: string,
): Record<string, unknown> {
  const targetDataSourceId = getPlatformDeviceDataSourceId(deviceId);
  return rewriteGenericPlatformBindings(cloneValue(widget), targetDataSourceId);
}

export function hydrateDevicePresetSchema(
  schema: DevicePresetSchema,
  deviceId: string,
): DevicePresetSchema {
  const targetDataSourceId = getPlatformDeviceDataSourceId(deviceId);
  const clonedSchema = cloneValue(schema);

  return {
    ...clonedSchema,
    nodes: Array.isArray(clonedSchema.nodes)
      ? rewriteGenericPlatformBindings(clonedSchema.nodes, targetDataSourceId)
      : [],
    ...(Array.isArray(clonedSchema.dataSources)
      ? {
          dataSources: clonedSchema.dataSources.map((dataSource) =>
            hydratePlatformDataSource(dataSource as DataSource, deviceId),
          ),
        }
      : {}),
  };
}
