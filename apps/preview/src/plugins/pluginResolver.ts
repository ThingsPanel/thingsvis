import { UniversalLoader } from '@thingsvis/kernel';
import type { PluginMainModule } from '@thingsvis/schema';
import { fetchRegistryMap } from './registryClient';

type LoadedPlugin = {
  entry: PluginMainModule;
};

const pluginCache = new Map<string, Promise<LoadedPlugin>>();

function normalizeMainModule(mod: any): PluginMainModule {
  // Support both default-exported object and named exports
  const target = mod?.default || mod?.Main || mod;
  // 支持 Leafer 模板 (create) 和 Overlay 模板 (createOverlay)
  if (target && (typeof target.create === 'function' || typeof target.createOverlay === 'function')) {
    return target as PluginMainModule;
  }
  throw new Error('Invalid plugin module: expected exports to include { create } or { createOverlay }');
}

export async function loadPlugin(componentId: string): Promise<LoadedPlugin> {
  const existing = pluginCache.get(componentId);
  if (existing) return existing;

  const p = (async () => {
    const registry = await fetchRegistryMap();
    const entry = registry[componentId];
    if (!entry) {
      throw new Error(`Component "${componentId}" not found in registry`);
    }

    // Preview mode: prefer static entry URL (pre-built plugins) over remote dev server
    // This allows preview to work without plugin dev servers running
    // Convert relative staticEntryUrl to absolute URL based on current origin
    let entryUrl = entry.staticEntryUrl || entry.remoteEntryUrl;
    if (entryUrl.startsWith('/')) {
      entryUrl = window.location.origin + entryUrl;
    }
    
    await UniversalLoader.registerRemote(entry.remoteName, entryUrl);
    const loaded = await UniversalLoader.loadComponent<any>(entry.remoteName, entry.exposedModule);

    const main = normalizeMainModule(loaded);
    return { entry: main };
  })();

  pluginCache.set(componentId, p);
  return p;
}


