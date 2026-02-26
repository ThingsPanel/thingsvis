import { ComponentRegistrySchema, type ComponentRegistry, type ComponentRegistryEntry } from '@thingsvis/schema';

export type ComponentRegistryMap = Record<string, ComponentRegistryEntry>;

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
