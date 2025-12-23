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
    
    // 处理 (Local) 后缀
    const isLocalRequested = componentId.endsWith(' (Local)');
    const actualId = isLocalRequested ? componentId.replace(' (Local)', '') : componentId;
    
    const entry = registry[actualId];
    if (!entry) {
      throw new Error(`Component "${actualId}" not found in registry`);
    }

    // 决定加载来源：本地开发服务、静态编译包、还是远程地址
    let finalUrl = entry.remoteEntryUrl;
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isLocalRequested) {
      // 强制使用本地，如果是 (Local) 条目
      finalUrl = entry.localEntryUrl || entry.staticEntryUrl || entry.remoteEntryUrl;
      console.log(`[pluginResolver] Force local/static source for ${componentId}: ${finalUrl}`);
    } else if (entry.debugSource === 'static' && entry.staticEntryUrl) {
      // 优先使用宿主托管的静态编译文件
      finalUrl = entry.staticEntryUrl;
      console.log(`[pluginResolver] Using static source for ${componentId}: ${finalUrl}`);
    } else if (entry.debugSource === 'local' && entry.localEntryUrl) {
      // 优先使用插件独立的开发服务
      finalUrl = entry.localEntryUrl;
      console.log(`[pluginResolver] Using local dev server for ${componentId}: ${finalUrl}`);
    } else if (isDev && entry.staticEntryUrl) {
      // 开发环境下，如果没有显式指定且存在静态文件，默认降级到静态文件（避免必须开插件服务）
      finalUrl = entry.staticEntryUrl;
      console.log(`[pluginResolver] Dev mode fallback to static source for ${componentId}: ${finalUrl}`);
    }

    // 开发阶段：直接使用远程 URL 注册 remote，避免 Blob/ObjectURL → manifest 解析导致的 RUNTIME-003。
    // 说明：当前 @module-federation/runtime 会为 remoteEntry 生成独立 manifest.json；
    // 如果我们通过 Blob URL 注入 JS 源码，runtime 会把该 blob 当作 manifest 去解析 JSON，最终报错。
    // 因此 preview 应用暂时关闭 IndexedDB 缓存，待后续升级为"缓存 manifest + 远程 JS"再重新启用。
    await UniversalLoader.registerRemote(entry.remoteName, finalUrl);
    const loaded = await UniversalLoader.loadComponent<any>(entry.remoteName, entry.exposedModule);

    const main = normalizeMainModule(loaded);
    return { entry: main };
  })();

  pluginCache.set(componentId, p);
  return p;
}

