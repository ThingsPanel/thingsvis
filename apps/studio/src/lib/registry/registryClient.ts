import {
  ComponentRegistrySchema,
  type ComponentRegistry,
  type ComponentRegistryEntry,
} from '@thingsvis/schema';

export type ComponentRegistryMap = Record<string, ComponentRegistryEntry>;
export type RegistryListEntry = ComponentRegistryEntry & {
  componentId: string;
  displayName: string;
  icon?: string;
  iconUrl?: string;
  order?: number;
};

export async function fetchRegistry(url = '/registry.json'): Promise<ComponentRegistry> {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(`Failed to fetch registry.json (${res.status})`);
  }
  const json = (await res.json()) as unknown;
  return ComponentRegistrySchema.parse(json);
}

export async function fetchRegistryMap(url = '/registry.json'): Promise<ComponentRegistryMap> {
  const registry = await fetchRegistry(url);
  return registry.components;
}

export function toRegistryEntries(registry: ComponentRegistry): RegistryListEntry[] {
  const entries: RegistryListEntry[] = [];

  Object.entries(registry.components).forEach(([componentId, entry]) => {
    const entryMeta = entry as ComponentRegistryEntry & { iconUrl?: string };
    entries.push({
      ...entry,
      componentId,
      displayName: entry.name ?? componentId,
      icon: entry.icon,
      iconUrl: entryMeta.iconUrl,
      order: entry.order,
    });

    if (entry.localEntryUrl) {
      entries.push({
        ...entry,
        componentId: `${componentId} (Local)`,
        displayName: `${entry.name ?? componentId} (Local)`,
        icon: entry.icon,
        iconUrl: entryMeta.iconUrl,
        order: entry.order,
      });
    }
  });

  // 按 order 排序，未设置 order 的组件排在最后
  return entries.sort((a, b) => {
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });
}
