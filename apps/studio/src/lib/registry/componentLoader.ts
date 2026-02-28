import { UniversalLoader } from '@thingsvis/kernel';
import type { WidgetMainModule } from '@thingsvis/schema';
import { fetchRegistryMap } from './registryClient';
import i18n from '@/i18n';

type LoadedComponent = {
    entry: WidgetMainModule;
};

const componentCache = new Map<string, Promise<LoadedComponent>>();
/** Synchronous cache populated after each component resolves */
const resolvedWidgets = new Map<string, WidgetMainModule>();

/**
 * Synchronously returns a previously-loaded widget (if in cache).
 * Returns null if the widget has not been loaded yet.
 */
export function getResolvedWidget(componentId: string): WidgetMainModule | null {
  const actualId = componentId.replace(' (Local)', '');
  return resolvedWidgets.get(actualId) ?? null;
}

function normalizeMainModule(mod: any): WidgetMainModule {
    // Support both default-exported object and named exports
    const target = mod?.default || mod?.Main || mod;
    // 支持 Leafer 模板 (create) 和 Overlay 模板 (createOverlay)
    if (target && (typeof target.create === 'function' || typeof target.createOverlay === 'function')) {
        return target as WidgetMainModule;
    }
    throw new Error('Invalid component module: expected exports to include { create } or { createOverlay }');
}

export async function loadComponent(componentId: string): Promise<LoadedComponent> {
    const existing = componentCache.get(componentId);
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

        } else if (entry.debugSource === 'static' && entry.staticEntryUrl) {
            // 优先使用宿主托管的静态编译文件
            finalUrl = entry.staticEntryUrl;

        } else if (entry.debugSource === 'local' && entry.localEntryUrl) {
            // 优先使用插件独立的开发服务
            finalUrl = entry.localEntryUrl;

        } else if (isDev && entry.staticEntryUrl) {
            // 开发环境下，如果没有显式指定且存在静态文件，默认降级到静态文件（避免必须开插件服务）
            finalUrl = entry.staticEntryUrl;

        }

        // 开发阶段：直接使用远程 URL 注册 remote，避免 Blob/ObjectURL → manifest 解析导致的 RUNTIME-003。
        // 说明：当前 @module-federation/runtime 会为 remoteEntry 生成独立 manifest.json；
        // 如果我们通过 Blob URL 注入 JS 源码，runtime 会把该 blob 当作 manifest 去解析 JSON，最终报错。
        // 因此 preview 应用暂时关闭 IndexedDB 缓存，待后续升级为"缓存 manifest + 远程 JS"再重新启用。
        await UniversalLoader.registerRemote(entry.remoteName, finalUrl);
        const loaded = await UniversalLoader.loadComponent<any>(entry.remoteName, entry.exposedModule);

        const main = normalizeMainModule(loaded);

        // Populate sync cache for constraint queries (e.g. TransformControls)
        resolvedWidgets.set(actualId, main);

        // Register component translations into Editor namespace if available
        if (main.locales) {
            Object.keys(main.locales).forEach(lng => {
                const resources = main.locales![lng];
                if (resources.editor) {
                    Object.keys(resources).forEach(ns => {
                        i18n.addResourceBundle(lng, ns, resources[ns], true, true);
                    });
                } else {
                    // Flat structure from new components, inject into 'editor' namespace directly
                    i18n.addResourceBundle(lng, 'editor', resources, true, true);
                }
            });
        }

        return { entry: main };
    })();

    componentCache.set(componentId, p);
    return p;
}

// Alias for backward compatibility — prefer loadComponent for new code
export const loadWidget = loadComponent;
