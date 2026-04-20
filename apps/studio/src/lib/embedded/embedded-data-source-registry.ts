import type { EmbeddedProviderCatalog } from './embedded-data-source';
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
