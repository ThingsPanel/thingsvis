export const TEMPLATE_DEVICE_ID = '__template__';

const GENERATED_PLATFORM_DATA_SOURCE_ID_RE = /^__platform_.+__$/;
const GENERATED_HOST_DATA_SOURCE_ID_RE = /^(?:__platform_.+__|thingspanel_.+)$/;
const DATA_SOURCE_EXPRESSION_RE = /ds\.([^\s.}]+)\./g;

export function isTemplateDeviceId(deviceId: unknown): boolean {
  return deviceId === TEMPLATE_DEVICE_ID;
}

export function isGeneratedPlatformDataSourceId(id: unknown): boolean {
  return typeof id === 'string' && GENERATED_PLATFORM_DATA_SOURCE_ID_RE.test(id);
}

export function isGeneratedHostDataSourceId(id: unknown): boolean {
  return typeof id === 'string' && GENERATED_HOST_DATA_SOURCE_ID_RE.test(id);
}

export function collectReferencedDataSourceIds(
  value: unknown,
  referencedIds = new Set<string>(),
): Set<string> {
  if (typeof value === 'string') {
    DATA_SOURCE_EXPRESSION_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = DATA_SOURCE_EXPRESSION_RE.exec(value))) {
      if (match[1]) referencedIds.add(match[1]);
    }
    return referencedIds;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectReferencedDataSourceIds(item, referencedIds));
    return referencedIds;
  }

  if (value && typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      if (key === 'dataSourceId' && typeof item === 'string') {
        referencedIds.add(item);
      }
      collectReferencedDataSourceIds(item, referencedIds);
    });
  }

  return referencedIds;
}

function stripEditorRuntimeState(dataSource: Record<string, unknown>): Record<string, unknown> {
  if (!dataSource.__editorAutoManual) return dataSource;
  const { __editorAutoManual: _editorAutoManual, mode: _mode, ...rest } = dataSource;
  return rest;
}

function stripTemplateDeviceId(dataSource: Record<string, unknown>): Record<string, unknown> {
  if (String(dataSource.type ?? '').toUpperCase() !== 'PLATFORM_FIELD') return dataSource;
  const config = dataSource.config;
  if (!config || typeof config !== 'object') return dataSource;
  if (!isTemplateDeviceId((config as Record<string, unknown>).deviceId)) return dataSource;
  const { deviceId: _deviceId, ...restConfig } = config as Record<string, unknown>;
  return { ...dataSource, config: restConfig };
}

export function sanitizeDataSourcesForHostSave(
  nodes: unknown[],
  dataSources: unknown[],
  context?: string | null,
): Record<string, unknown>[] {
  if (!Array.isArray(dataSources)) return [];

  const shouldKeepDashboardProviderSources = context === 'dashboard';
  const referencedIds = collectReferencedDataSourceIds(nodes);

  return dataSources
    .filter(
      (dataSource): dataSource is Record<string, unknown> =>
        Boolean(dataSource) && typeof dataSource === 'object',
    )
    .filter((dataSource) => {
      const id = dataSource.id;
      if (shouldKeepDashboardProviderSources && /^thingspanel_.+$/.test(String(id ?? ''))) {
        return true;
      }
      if (!isGeneratedHostDataSourceId(id)) return true;
      return referencedIds.has(String(id));
    })
    .map((dataSource) => stripTemplateDeviceId(stripEditorRuntimeState(dataSource)));
}
