import type { LoadRemoteModuleOptions, RemoteModule } from '@module-federation/runtime';
import { init as initRemote, loadRemote } from '@module-federation/runtime';

type RemoteScopeConfig = {
  name: string;
  entry: string;
};

type RemoteCacheKey = string;

/**
 * UniversalLoader
 *
 * - Singleton Loader instance
 * - Dynamically registers remote scopes at runtime
 * - Caches remote load promises per (scope/module) to avoid duplicate work
 */
export class Loader {
  private static _instance: Loader | null = null;

  static get instance(): Loader {
    if (!Loader._instance) {
      Loader._instance = new Loader();
    }
    return Loader._instance;
  }

  private remoteConfigs = new Map<string, RemoteScopeConfig>();
  private remoteInitPromises = new Map<string, Promise<void>>();
  private moduleCache = new Map<RemoteCacheKey, Promise<RemoteModule>>();

  private constructor() {
    // singleton – use Loader.instance
  }

  /**
   * Register a new remote scope at runtime.
   *
   * Subsequent `loadComponent` calls for this scope will reuse the same init promise.
   */
  registerRemote(name: string, entry: string): Promise<void> {
    const existing = this.remoteInitPromises.get(name);
    if (existing) {
      return existing;
    }

    const config: RemoteScopeConfig = { name, entry };
    this.remoteConfigs.set(name, config);

    const initPromise = initRemote({
      name: config.name,
      remotes: [
        {
          name: config.name,
          entry: config.entry
        }
      ]
    });

    this.remoteInitPromises.set(name, initPromise);
    return initPromise;
  }

  /**
   * Load a federated module from a registered remote scope.
   *
   * Results are cached per (scope/module) and the same Promise is returned
   * for concurrent callers.
   */
  async loadComponent<T = unknown>(scope: string, module: string): Promise<T> {
    const cacheKey: RemoteCacheKey = `${scope}|${module}`;
    const existing = this.moduleCache.get(cacheKey) as Promise<T> | undefined;
    if (existing) {
      return existing;
    }

    const initPromise = this.remoteInitPromises.get(scope);
    if (!initPromise) {
      throw new Error(`Remote scope "${scope}" has not been registered. Call registerRemote() first.`);
    }

    const loadPromise = (async () => {
      await initPromise;
      const options: LoadRemoteModuleOptions = {
        remote: scope,
        module
      };
      const remoteModule = (await loadRemote<T>(options)) as T;
      return remoteModule;
    })();

    this.moduleCache.set(cacheKey, loadPromise as unknown as Promise<RemoteModule>);
    return loadPromise;
  }
}

export const UniversalLoader = Loader.instance;


