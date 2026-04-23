import type {
  EmbeddedDataSourceDef,
  EmbeddedDataSourceGroup,
  EmbeddedProviderCatalog,
} from './embedded-data-source';
import { thingspanelCatalog } from './providers/thingspanel.catalog';

const EMBEDDED_PROVIDER_CATALOGS: Record<string, EmbeddedProviderCatalog> = {
  [thingspanelCatalog.provider]: thingspanelCatalog,
};

export function resolveEmbeddedProviderCatalog(
  provider?: string | null,
): EmbeddedProviderCatalog | undefined {
  const normalized = typeof provider === 'string' ? provider.trim().toLowerCase() : '';
  if (!normalized) return undefined;
  return EMBEDDED_PROVIDER_CATALOGS[normalized];
}

function shouldIncludeGroup(
  source: EmbeddedDataSourceDef,
  groups?: EmbeddedDataSourceGroup[],
): boolean {
  if (!Array.isArray(groups) || groups.length === 0) return true;
  return groups.includes(source.group);
}

export function listEmbeddedProviderDataSourceIds(
  provider?: string | null,
  options?: { groups?: EmbeddedDataSourceGroup[] },
): string[] {
  const catalog = resolveEmbeddedProviderCatalog(provider);
  if (!catalog) return [];

  return catalog.dataSources
    .filter((source) => shouldIncludeGroup(source, options?.groups))
    .map((source) => source.id);
}

export function buildEmbeddedProviderDataSources(
  provider?: string | null,
  runtimeVariableValues: Record<string, unknown> = {},
  options?: { groups?: EmbeddedDataSourceGroup[] },
): Array<Record<string, any>> {
  const catalog = resolveEmbeddedProviderCatalog(provider);
  if (!catalog) return [];

  const hasRuntimeDeviceId =
    typeof runtimeVariableValues.deviceId === 'string' &&
    runtimeVariableValues.deviceId.trim().length > 0;

  return catalog.dataSources
    .filter((source) => shouldIncludeGroup(source, options?.groups))
    .map((source) => {
      const isCurrentDeviceScoped =
        source.group === 'current-device' || source.group === 'current-device-history';

      return {
        id: source.id,
        name: source.id,
        type: 'REST',
        config: {
          url: source.url,
          method: 'GET',
          headers: {
            'x-token': '{{ var.platformToken }}',
          },
          params: source.params ?? {},
          pollingInterval: 60,
          timeout: 30,
          auth: { type: 'none' },
        },
        transformation: source.transformation,
        ...(isCurrentDeviceScoped && !hasRuntimeDeviceId ? { mode: 'manual' } : {}),
      };
    });
}
