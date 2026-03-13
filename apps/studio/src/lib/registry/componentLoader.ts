import { UniversalLoader } from '@thingsvis/kernel';
import type { WidgetMainModule } from '@thingsvis/schema';
import i18n from '@/i18n';
import { ensureRegistryLoaded } from './registry-store';

const COMPONENT_LOAD_TIMEOUT_MS = 60_000;
const DEFAULT_PRELOAD_CONCURRENCY = 4;

type LoadedComponent = {
  entry: WidgetMainModule;
};

export interface ResolvedWidgetDescriptor {
  componentId: string;
  actualId: string;
  remoteName: string;
  exposedModule: string;
  finalUrl: string;
  version?: string;
}

const componentCache = new Map<string, Promise<LoadedComponent>>();
const resolvedWidgets = new Map<string, WidgetMainModule>();

function getActualComponentId(componentId: string): string {
  return componentId.replace(' (Local)', '');
}

function normalizeMainModule(mod: unknown): WidgetMainModule {
  const moduleRecord = mod as Record<string, unknown>;
  const target = (moduleRecord?.default || moduleRecord?.Main || mod) as Record<string, unknown>;

  if (
    target &&
    (typeof target.create === 'function' || typeof target.createOverlay === 'function')
  ) {
    return target as WidgetMainModule;
  }

  throw new Error(
    'Invalid component module: expected exports to include { create } or { createOverlay }',
  );
}

function resolveFinalUrl(
  componentId: string,
  entry: {
    remoteEntryUrl: string;
    localEntryUrl?: string;
    staticEntryUrl?: string;
    debugSource?: string;
  },
): string {
  const isLocalRequested = componentId.endsWith(' (Local)');
  const isDev = process.env.NODE_ENV === 'development';
  const withDevCacheBust = (url: string): string => {
    if (!isDev) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}tvcb=${Date.now()}`;
  };

  if (isLocalRequested) {
    if (entry.localEntryUrl) return entry.localEntryUrl;
    if (entry.staticEntryUrl) return withDevCacheBust(entry.staticEntryUrl);
    return entry.remoteEntryUrl;
  }

  if (entry.debugSource === 'static' && entry.staticEntryUrl) {
    return withDevCacheBust(entry.staticEntryUrl);
  }

  if (entry.debugSource === 'local' && entry.localEntryUrl) {
    return entry.localEntryUrl;
  }

  if (isDev && entry.staticEntryUrl) {
    return withDevCacheBust(entry.staticEntryUrl);
  }

  return entry.remoteEntryUrl;
}

function registerLocales(main: WidgetMainModule) {
  if (!main.locales) {
    return;
  }

  Object.keys(main.locales).forEach((language) => {
    const resources = main.locales?.[language] as Record<string, Record<string, unknown>>;
    if (!resources) {
      return;
    }

    if (resources.editor) {
      Object.keys(resources).forEach((namespace) => {
        i18n.addResourceBundle(language, namespace, resources[namespace], true, true);
      });
      return;
    }

    i18n.addResourceBundle(language, 'editor', resources, true, true);
  });
}

export function getResolvedWidget(componentId: string): WidgetMainModule | null {
  return resolvedWidgets.get(getActualComponentId(componentId)) ?? null;
}

export async function resolveWidgetDescriptor(
  componentId: string,
): Promise<ResolvedWidgetDescriptor> {
  const { map } = await ensureRegistryLoaded();
  const actualId = getActualComponentId(componentId);
  const entry = map[actualId];

  if (!entry) {
    throw new Error(`Component "${actualId}" not found in registry`);
  }

  return {
    componentId,
    actualId,
    remoteName: entry.remoteName,
    exposedModule: entry.exposedModule,
    finalUrl: resolveFinalUrl(componentId, entry),
    version: entry.version,
  };
}

export async function loadComponent(componentId: string): Promise<LoadedComponent> {
  const existing = componentCache.get(componentId);
  if (existing) {
    return existing;
  }

  const promise = (async () => {
    const loadPromise = (async () => {
      const descriptor = await resolveWidgetDescriptor(componentId);
      await UniversalLoader.registerRemote(descriptor.remoteName, descriptor.finalUrl);
      const loaded = await UniversalLoader.loadComponent<Record<string, unknown>>(
        descriptor.remoteName,
        descriptor.exposedModule,
      );

      const main = normalizeMainModule(loaded);
      resolvedWidgets.set(descriptor.actualId, main);
      registerLocales(main);

      return { entry: main };
    })();

    return Promise.race([
      loadPromise,
      new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `Component load timeout after ${COMPONENT_LOAD_TIMEOUT_MS}ms: ${componentId}`,
              ),
            ),
          COMPONENT_LOAD_TIMEOUT_MS,
        ),
      ),
    ]);
  })();

  promise.catch(() => {
    componentCache.delete(componentId);
  });
  componentCache.set(componentId, promise);
  return promise;
}

async function runPreloadWorker(componentIds: string[]) {
  for (const componentId of componentIds) {
    try {
      await loadComponent(componentId);
    } catch (error) {
      console.warn(`[preloadComponentTypes] Failed to preload component "${componentId}":`, error);
    }
  }
}

export async function preloadComponentTypes(
  componentIds: string[],
  options?: { concurrency?: number },
): Promise<void> {
  const uniqueComponentIds = Array.from(new Set(componentIds.filter(Boolean)));
  if (uniqueComponentIds.length === 0) {
    return;
  }

  const concurrency = Math.max(
    1,
    Math.min(options?.concurrency ?? DEFAULT_PRELOAD_CONCURRENCY, uniqueComponentIds.length),
  );
  const workers = Array.from({ length: concurrency }, (_, workerIndex) =>
    uniqueComponentIds.filter((_, index) => index % concurrency === workerIndex),
  );

  await Promise.all(workers.map((workerIds) => runPreloadWorker(workerIds)));
}

export const loadWidget = loadComponent;
