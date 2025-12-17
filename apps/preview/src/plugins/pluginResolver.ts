import { UniversalLoader } from '@thingsvis/kernel';
import type { PluginMainModule } from '@thingsvis/schema';
import { fetchRegistryMap } from './registryClient';

type LoadedPlugin = {
  entry: PluginMainModule;
};

const pluginCache = new Map<string, Promise<LoadedPlugin>>();

function normalizeMainModule(mod: any): PluginMainModule {
  // Support both default-exported object and named exports
  if (mod?.default?.componentId && typeof mod.default?.create === 'function') return mod.default as PluginMainModule;
  if (mod?.Main?.componentId && typeof mod.Main?.create === 'function') return mod.Main as PluginMainModule;
  if (mod?.componentId && typeof mod?.create === 'function') return mod as PluginMainModule;
  throw new Error('Invalid plugin module: expected exports to include { componentId, create }');
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

    // 开发阶段：直接使用远程 URL 注册 remote，避免 Blob/ObjectURL → manifest 解析导致的 RUNTIME-003。
    // 后续如果要启用 IndexedDB 缓存，再切回 UniversalLoader.registerRemoteCached。
    await UniversalLoader.registerRemote(entry.remoteName, entry.remoteEntryUrl);
    const loaded = await UniversalLoader.loadComponent<any>(entry.remoteName, entry.exposedModule);

    const main = normalizeMainModule(loaded);
    return { entry: main };
  })();

  pluginCache.set(componentId, p);
  return p;
}


