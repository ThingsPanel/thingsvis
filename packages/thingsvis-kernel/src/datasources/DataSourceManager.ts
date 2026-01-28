import { DataSource, DataSourceType } from '@thingsvis/schema';
import { BaseAdapter } from './BaseAdapter';
import { KernelStore } from '../store/KernelStore';
import { StaticAdapter } from './StaticAdapter';
import { WSAdapter } from './WSAdapter';
import { RESTAdapter } from './RESTAdapter';
import { PlatformFieldAdapter } from './PlatformFieldAdapter';
import { get, set, del, keys } from 'idb-keyval';
import type { DataSourceSyncAdapter } from './DataSourceSync';
import { NoopSyncAdapter } from './DataSourceSync';

type AdapterConstructor = new () => BaseAdapter;

const STORAGE_KEY_PREFIX = 'thingsvis_ds_';

/**
 * DataSourceManager: Manages the lifecycle of all data sources in the kernel.
 * Singleton registry for adapters and their states.
 */
export class DataSourceManager {
  private static instance: DataSourceManager;
  private adapters: Map<string, BaseAdapter> = new Map();
  private configs: Map<string, DataSource> = new Map();
  private adapterRegistry: Map<DataSourceType, AdapterConstructor> = new Map();
  private store?: KernelStore;
  private syncAdapter: DataSourceSyncAdapter = new NoopSyncAdapter();

  private constructor() {
    // Register built-in adapters
    this.registerAdapterType('STATIC', StaticAdapter);
    this.registerAdapterType('WS', WSAdapter);
    this.registerAdapterType('REST', RESTAdapter);
    this.registerAdapterType('PLATFORM_FIELD', PlatformFieldAdapter);
  }

  public static getInstance(): DataSourceManager {
    if (!DataSourceManager.instance) {
      DataSourceManager.instance = new DataSourceManager();
    }
    return DataSourceManager.instance;
  }

  /**
   * Set the sync adapter for cloud synchronization
   */
  public setSyncAdapter(adapter: DataSourceSyncAdapter): void {
    this.syncAdapter = adapter;
  }

  /**
   * Initializes the manager and loads saved data sources from backend and browser storage.
   */
  public async init(store: KernelStore): Promise<void> {
    this.store = store;

    // 1. Try to load from cloud first (if sync adapter is configured)
    try {
      const cloudConfigs = await this.syncAdapter.loadAll();

      for (const config of cloudConfigs) {
        // Register without persisting locally (already in cloud)
        await this.registerDataSource(config, false).catch(e => {
          console.error(`Failed to load cloud data source ${config.id}:`, e);
        });
      }
    } catch (e) {
      console.warn('Failed to load from cloud, will use local storage:', e);
    }

    // 2. Load from local storage as fallback/backup
    await this.loadFromStorage();
  }

  /**
   * Loads all persisted data sources from IndexedDB.
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const allKeys = await keys();
      const dsKeys = (allKeys as string[]).filter(k => k.startsWith(STORAGE_KEY_PREFIX));



      for (const key of dsKeys) {
        const config = await get<DataSource>(key);
        if (config && !this.configs.has(config.id)) {
          // Only load from local if not already loaded from cloud
          this.registerDataSource(config, false).catch(e => {
            console.error(`Failed to load local data source:`, e);
          });
        }
      }
    } catch (e) {
      console.error('Failed to load from local storage:', e);
    }
  }

  /**
   * Registers a constructor for a specific data source type.
   */
  public registerAdapterType(type: DataSourceType, constructor: AdapterConstructor): void {
    this.adapterRegistry.set(type, constructor);
  }

  /**
   * Initializes and connects a data source based on its configuration.
   * @param persist Whether to save this config to IndexedDB (default: true)
   */
  public async registerDataSource(config: DataSource, persist: boolean = true): Promise<void> {
    const existing = this.adapters.get(config.id);
    if (existing) {
      // If config hasn't changed, ignore (simple check)
      if (JSON.stringify(this.configs.get(config.id)) === JSON.stringify(config)) {
        return;
      }
      await existing.disconnect();
    }

    const AdapterClass = this.adapterRegistry.get(config.type);
    if (!AdapterClass) {
      throw new Error(`[DataSourceManager] No adapter registered for type: ${config.type}`);
    }

    const adapter = new AdapterClass();
    this.adapters.set(config.id, adapter);
    this.configs.set(config.id, config);

    // Save to storage if requested
    if (persist) {
      set(`${STORAGE_KEY_PREFIX}${config.id}`, config).catch(e => {
        console.error('Failed to save to local storage:', e);
      });

      // Sync to cloud
      try {
        await this.syncAdapter.save(config);
      } catch (e) {
        console.error('Failed to sync to cloud:', e);
        // Don't throw - local save succeeded
      }
    }

    // Sync with store
    this.store?.getState().setDataSourceState(config.id, {
      status: 'loading',
      lastUpdated: Date.now()
    });

    // Wire up adapter events to store
    adapter.onData((data) => {
      this.store?.getState().updateDataSourceData(config.id, data);
    });

    adapter.onError((error) => {
      this.store?.getState().setDataSourceState(config.id, {
        status: 'error',
        error: String(error),
        lastUpdated: Date.now()
      });
    });

    try {
      await adapter.connect(config);
      this.store?.getState().setDataSourceState(config.id, {
        status: 'connected',
        lastUpdated: Date.now()
      });
    } catch (error) {

      this.store?.getState().setDataSourceState(config.id, {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        lastUpdated: Date.now()
      });
      throw error;
    }
  }

  /**
   * Disconnects and removes a data source.
   */
  public async unregisterDataSource(id: string): Promise<void> {
    const adapter = this.adapters.get(id);

    // Remove from storage
    del(`${STORAGE_KEY_PREFIX}${id}`).catch(e => {
      console.error('Failed to delete from local storage:', e);
    });

    // Remove from cloud
    try {
      await this.syncAdapter.delete(id);
    } catch (e) {
      console.error('Failed to delete from cloud:', e);
      // Don't throw - local delete succeeded
    }

    if (adapter) {
      try {
        await adapter.disconnect();
      } catch (e) {
        console.error('Failed to disconnect adapter:', e);
      }
      this.adapters.delete(id);
      this.configs.delete(id);
      this.store?.getState().setDataSourceState(id, {
        status: 'disconnected',
        lastUpdated: Date.now()
      });
    }
  }

  public getAdapter(id: string): BaseAdapter | undefined {
    return this.adapters.get(id);
  }

  public getConfig(id: string): DataSource | undefined {
    return this.configs.get(id);
  }

  /**
   * Get all registered data source configurations.
   * Used for saving to project files.
   */
  public getAllConfigs(): DataSource[] {
    return Array.from(this.configs.values());
  }

  /**
   * Disconnects all data sources.
   */
  public async dispose(): Promise<void> {
    const ids = Array.from(this.adapters.keys());
    await Promise.all(ids.map(id => this.unregisterDataSource(id)));
  }
}

export const dataSourceManager = DataSourceManager.getInstance();

