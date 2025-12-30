import * as mfRuntime from '@module-federation/runtime';

type RemoteScopeConfig = {
  name: string;
  entry: string;
  version?: string;
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
  private moduleCache = new Map<RemoteCacheKey, Promise<unknown>>();
  private remoteEntryFetchPromises = new Map<string, Promise<string>>();
  private host?: any;

  private constructor() {
    // singleton – use Loader.instance
  }

  /**
   * Register a new remote scope at runtime with cache metadata.
   *
   * 如果同一个 remoteName 的 version/entry 发生变化，清理旧的 init/module 缓存，确保可重新加载。
   */
  async registerRemoteWithVersion(name: string, entry: string, version: string): Promise<void> {
    const prev = this.remoteConfigs.get(name);
    if (prev && (prev.entry !== entry || prev.version !== version)) {
      // 关键：版本变化时必须清理缓存，否则会一直使用旧 remote container
      this.remoteInitPromises.delete(name);
      for (const key of Array.from(this.moduleCache.keys())) {
        if (key.startsWith(`${name}|`)) this.moduleCache.delete(key);
      }
    }
    this.remoteConfigs.set(name, { name, entry, version });
    await this.registerRemote(name, entry);
    // registerRemote() 会再次写入 remoteConfigs；这里再写一遍确保 version 不丢失（用于 cacheKey）。
    this.remoteConfigs.set(name, { name, entry, version });
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

    const prev = this.remoteConfigs.get(name);
    const config: RemoteScopeConfig = { name, entry, version: prev?.version };
    this.remoteConfigs.set(name, config);

    if (!this.host) {
      // 关键：runtime init() 返回 FederationHost（同步），并且是全局单例。
      const initRemote = (mfRuntime as any).init;
      if (typeof initRemote !== 'function') {
        throw new Error('Module Federation runtime is missing init()');
      }

      this.host = initRemote({
        name: 'thingsvis_host',
        remotes: []
      });
    }

    // Register/overwrite remote mapping for this host instance
    this.host.registerRemotes([{ name: config.name, entry: config.entry }], { force: true });

    const initPromise = Promise.resolve();

    this.remoteInitPromises.set(name, initPromise);
    return initPromise;
  }

  /**
   * Load a remote container entry script text with in-flight dedupe.
   */
  private fetchRemoteEntryText(remoteEntryUrl: string): Promise<string> {
    const existing = this.remoteEntryFetchPromises.get(remoteEntryUrl);
    if (existing) return existing;

    const p = (async () => {
      // 关键：这里是“网络入口”请求，失败需要明确报错，但不能导致整个应用崩溃
      const res = await fetch(remoteEntryUrl, { cache: 'no-cache' });
      if (!res.ok) {
        throw new Error(`Failed to fetch remoteEntry: ${remoteEntryUrl} (${res.status})`);
      }
      return await res.text();
    })();

    this.remoteEntryFetchPromises.set(remoteEntryUrl, p);
    p.finally(() => this.remoteEntryFetchPromises.delete(remoteEntryUrl)).catch(() => void 0);
    return p;
  }

  /**
   * Register remote using a cached `remoteEntry.js` (IndexedDB) when available.
   *
   * MVP note:
   * - We load the remoteEntry via Blob/ObjectURL.
   * - 因此插件构建必须避免 code-splitting（否则 chunk URL 可能会基于 blob: 解析失败）。
   */
  async registerRemoteCached(name: string, remoteEntryUrl: string, version: string): Promise<void> {
    const { getCachedRemoteEntry, setCachedRemoteEntry } = await import('./RemoteEntryCache');

    try {
      const cached = await getCachedRemoteEntry(remoteEntryUrl);
      if (cached && cached.version === version && cached.sourceText) {
        const blob = new Blob([cached.sourceText], { type: 'text/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        // 注意：不能在这里立即 revokeObjectURL。
        // MF runtime 会在稍后异步去抓取 manifest（其 URL = blobUrl），
        // 如果我们过早 revoke，就会出现 RUNTIME-003: Failed to fetch manifest。
        // 为了简单起见，先保留 blob 的生命周期到页面关闭，后续再考虑更精细的释放策略。
        await this.registerRemoteWithVersion(name, blobUrl, version);
        return;
      }
    } catch {
      // ignore cache errors; fall back to network
    }

    // Cache miss / stale cache → fetch, store, then register using blob
    const sourceText = await this.fetchRemoteEntryText(remoteEntryUrl);
    void setCachedRemoteEntry({
      remoteEntryUrl,
      version,
      sourceText,
      storedAt: new Date().toISOString()
    });

    const blob = new Blob([sourceText], { type: 'text/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    // 同上，不能立即 revokeObjectURL，否则 runtime 后续拉取 manifest 会失败。
    await this.registerRemoteWithVersion(name, blobUrl, version);
  }

  /**
   * Load a federated module from a registered remote scope.
   *
   * Results are cached per (scope/module) and the same Promise is returned
   * for concurrent callers.
   */
  async loadComponent<T = unknown>(scope: string, module: string): Promise<T> {
    const cfg = this.remoteConfigs.get(scope);
    const versionPart = cfg?.version ? `@${cfg.version}` : '';
    const cacheKey: RemoteCacheKey = `${scope}${versionPart}|${module}`;
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
      const expose = module.startsWith('./') ? module.slice(2) : module;
      const id = `${scope}/${expose}`;
      const loadRemote = (mfRuntime as any).loadRemote;
      if (typeof loadRemote !== 'function') {
        throw new Error('Module Federation runtime is missing loadRemote()');
      }

      const remoteModule = (await loadRemote(id)) as T;
      return remoteModule;
    })();

    this.moduleCache.set(cacheKey, loadPromise as unknown as Promise<unknown>);
    return loadPromise;
  }
}

export const UniversalLoader = Loader.instance;


