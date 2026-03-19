import { DataSource, DataSourceType } from '@thingsvis/schema';
import type { FieldMappingConfig } from '@thingsvis/schema';
import { BaseAdapter, type WriteResult } from './BaseAdapter';
import { KernelStore } from '../store/KernelStore';
import { StaticAdapter } from './StaticAdapter';
import { WSAdapter } from './WSAdapter';
import { RESTAdapter } from './RESTAdapter';
import { PlatformFieldAdapter } from './PlatformFieldAdapter';
import { FieldMappingExecutor } from './FieldMappingExecutor';
import { get, set, del, keys } from 'idb-keyval';
import type { DataSourceSyncAdapter } from './DataSourceSync';
import { NoopSyncAdapter } from './DataSourceSync';

type AdapterConstructor = new () => BaseAdapter;

const STORAGE_KEY_PREFIX = 'thingsvis_ds_';

/**
 * Maps legacy or variant type strings to canonical DataSourceType values.
 * Handles case-insensitive matching and alternative names.
 */
const LEGACY_TYPE_MAP = new Map<string, DataSourceType>([
  ['static', 'STATIC'],
  ['rest', 'REST'],
  ['ws', 'WS'],
  ['websocket', 'WS'],
  ['mqtt', 'MQTT'],
  ['platform_field', 'PLATFORM_FIELD'],
  ['platform', 'PLATFORM_FIELD'],
]);

/**
 * Normalizes a raw type string to a canonical DataSourceType.
 * Handles lowercase, legacy names, and case-insensitive matching.
 */
function normalizeDataSourceType(raw: string): DataSourceType {
  const mapped = LEGACY_TYPE_MAP.get(raw.toLowerCase());
  if (mapped) {
    return mapped;
  }
  // Fallback: uppercase the raw value (covers already-correct types)
  return raw.toUpperCase() as DataSourceType;
}

/**
 * Storage mode determines persistence strategy:
 * - 'cloud': backend available → persist to cloud only, skip IndexedDB
 * - 'local': backend unavailable → persist to IndexedDB as fallback
 */
type StorageMode = 'cloud' | 'local';

/**
 * DataSourceManager: Manages the lifecycle of all data sources in the kernel.
 * Singleton registry for adapters and their states.
 *
 * Persistence strategy:
 *   cloud mode  → write to backend API via syncAdapter, skip IndexedDB
 *   local mode  → write to IndexedDB (offline / no backend)
 */
export class DataSourceManager {
  private static instance: DataSourceManager;
  private adapters: Map<string, BaseAdapter> = new Map();
  private configs: Map<string, DataSource> = new Map();
  private adapterRegistry: Map<DataSourceType, AdapterConstructor> = new Map();
  /** Resolved (inferred or explicit) trigger mode per data source. */
  private resolvedModes: Map<string, 'auto' | 'manual'> = new Map();
  private store?: KernelStore;
  private syncAdapter: DataSourceSyncAdapter = new NoopSyncAdapter();
  private storageMode: StorageMode = 'local';

  public constructor() {
    // Register built-in adapters
    this.registerAdapterType('STATIC', StaticAdapter);
    this.registerAdapterType('WS', WSAdapter);
    this.registerAdapterType('REST', RESTAdapter);
    this.registerAdapterType('PLATFORM_FIELD', PlatformFieldAdapter);
  }

  public static getInstance(): DataSourceManager {
    if (!DataSourceManager.instance) {
      console.warn(
        '[DataSourceManager] getInstance() is deprecated. Create a runtime-scoped instance via createRuntimeServices().',
      );
      DataSourceManager.instance = new DataSourceManager();
    }
    return DataSourceManager.instance;
  }

  /**
   * Set the sync adapter for cloud synchronization.
   * Automatically switches storage mode to 'cloud'.
   */
  public setSyncAdapter(adapter: DataSourceSyncAdapter): void {
    this.syncAdapter = adapter;
    this.storageMode = adapter instanceof NoopSyncAdapter ? 'local' : 'cloud';
  }

  /**
   * Query whether cloud backend is active.
   */
  public isCloudMode(): boolean {
    return this.storageMode === 'cloud';
  }

  /**
   * Initializes the manager with the kernel store.
   * Only loads from local IndexedDB on first boot (before auth).
   * Cloud loading happens later via reloadFromCloud() after auth.
   */
  public async init(store: KernelStore): Promise<void> {
    this.store = store;

    // At init time, syncAdapter is still NoopSyncAdapter (auth not ready).
    // Only load from IndexedDB as a quick offline fallback.
    await this.loadFromStorage();

    // Subscribe to variable value changes so data sources that reference
    // {{ var.xxx }} expressions are automatically re-fetched (TASK-23 cascade refresh).
    store.subscribe((state, prevState) => {
      const curr = state.variableValues;
      const prev = prevState.variableValues;
      if (curr && curr !== prev) {
        this.onVariablesChanged(curr);
      }
    });
  }

  /**
   * Called when dashboard variable values change.
   * Notifies adapters whose configs reference {{ var.xxx }} / $var.xxx so they
   * can re-fetch with the updated values.
   */
  private onVariablesChanged(variableValues: Record<string, unknown>): void {
    for (const [id, adapter] of this.adapters.entries()) {
      const config = this.configs.get(id);
      if (!config) continue;
      // Quick check: does the serialised config reference any variable?
      const configJson = JSON.stringify(config.config ?? '');
      if (configJson.includes('var.') || configJson.includes('$var.')) {
        adapter.refreshWithVariables(variableValues).catch((err) => {
          console.error(`[DataSourceManager] refreshWithVariables failed for "${id}":`, err);
        });
      }
    }
  }

  /**
   * Reload all data sources from the cloud backend.
   * Called after authentication when ApiSyncAdapter is ready.
   * Replaces any locally loaded data sources with cloud versions.
   */
  public async reloadFromCloud(): Promise<void> {
    if (this.storageMode !== 'cloud') {
      return;
    }

    try {
      const cloudConfigs = await this.syncAdapter.loadAll();
      const cloudIds = new Set(cloudConfigs.map((c) => c.id));

      // Disconnect all existing adapters and remove them from the store
      const existingIds = Array.from(this.adapters.keys());
      for (const id of existingIds) {
        const adapter = this.adapters.get(id);
        if (adapter) {
          try {
            await adapter.disconnect();
          } catch {
            /* ignore */
          }
        }
        this.adapters.delete(id);
        this.configs.delete(id);
        // Clear from store immediately so UI doesn't show stale data during reload
        this.store?.getState().removeDataSourceFromStore(id);
      }

      // Also clear any orphan store entries that have no adapter (e.g. from previous sessions)
      const storeIds = Object.keys(this.store?.getState().dataSources ?? {});
      for (const id of storeIds) {
        if (!cloudIds.has(id)) {
          this.store?.getState().removeDataSourceFromStore(id);
        }
      }

      // Register all cloud data sources (persist=false, already in cloud)
      for (const config of cloudConfigs) {
        try {
          await this.registerDataSource(config, false);
        } catch (e) {
          console.error(`[DataSourceManager] Failed to load cloud data source ${config.id}:`, e);
        }
      }

      // Clear stale IndexedDB entries that are now managed by cloud
      this.clearLocalStorage().catch(() => {
        /* best effort */
      });
    } catch (e) {
      console.error('[DataSourceManager] Failed to reload from cloud:', e);
      throw e;
    }
  }

  /**
   * Loads all persisted data sources from IndexedDB.
   * Only used as offline fallback when backend is unavailable.
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const allKeys = await keys();
      const dsKeys = (allKeys as string[]).filter((k) => k.startsWith(STORAGE_KEY_PREFIX));

      for (const key of dsKeys) {
        const config = await get<DataSource>(key);
        if (config && !this.configs.has(config.id)) {
          this.registerDataSource(config, false).catch((e) => {
            console.error('[DataSourceManager] Failed to load local data source:', e);
          });
        }
      }
    } catch (e) {
      console.error('[DataSourceManager] Failed to load from local storage:', e);
    }
  }

  /**
   * Clear all data source entries from IndexedDB.
   */
  private async clearLocalStorage(): Promise<void> {
    const allKeys = await keys();
    const dsKeys = (allKeys as string[]).filter((k) => k.startsWith(STORAGE_KEY_PREFIX));
    await Promise.all(dsKeys.map((k) => del(k)));
  }

  /**
   * Registers a constructor for a specific data source type.
   */
  public registerAdapterType(type: DataSourceType, constructor: AdapterConstructor): void {
    this.adapterRegistry.set(type, constructor);
  }

  /**
   * Determine the effective trigger mode for a data source.
   *
   * Smart inference for backward compatibility with legacy configs that
   * have no explicit `mode` field:
   *   - REST data sources with a mutating HTTP method (POST/PUT/DELETE)
   *     and no polling are inferred as 'manual' (control/write endpoint).
   *   - All other data sources default to 'auto' (read/telemetry endpoint).
   *
   * An explicitly set `mode: 'manual'` always takes precedence.
   */
  private resolveEffectiveMode(
    config: DataSource,
    normalizedType: DataSourceType,
  ): 'auto' | 'manual' {
    // Explicit settings always win
    if ('mode' in config && config.mode === 'manual') return 'manual';
    if ('mode' in config && config.mode === 'auto') return 'auto';

    // Smart inference for legacy configs without explicit mode:
    // REST + mutating method + no polling → manual
    if (normalizedType === 'REST') {
      const rc = config.config as { method?: string; pollingInterval?: number };
      const method = (rc.method ?? 'GET').toUpperCase();
      const polling = rc.pollingInterval ?? 0;
      if (method !== 'GET' && polling <= 0) {
        return 'manual';
      }
    }

    return 'auto';
  }

  /**
   * Initializes and connects a data source based on its configuration.
   * @param persist Whether to save this config to persistent storage (default: true).
   *               In cloud mode → saves to backend API only.
   *               In local mode → saves to IndexedDB only.
   */
  public async registerDataSource(config: DataSource, persist: boolean = true): Promise<void> {
    // Normalize type to canonical uppercase form (handles legacy lowercase types)
    const normalizedType = normalizeDataSourceType(config.type);
    if (normalizedType !== config.type) {
      config = { ...config, type: normalizedType };
    }

    const existing = this.adapters.get(config.id);
    if (existing) {
      // If config hasn't changed, ignore (simple check)
      if (JSON.stringify(this.configs.get(config.id)) === JSON.stringify(config)) {
        return;
      }
      await existing.disconnect();
      // For PLATFORM_FIELD adapters, preserve existing store data during re-registration.
      // These adapters are driven by external push (tv:platform-data / WS), so the cached
      // value remains valid until the next push overwrites it. Clearing it here causes a
      // visible blank flash whenever tv:init updates requestedFields.
      if (normalizedType !== 'PLATFORM_FIELD') {
        this.store?.getState().removeDataSourceFromStore(config.id);
      }
    }

    const AdapterClass = this.adapterRegistry.get(config.type);
    if (!AdapterClass) {
      throw new Error(`[DataSourceManager] No adapter registered for type: ${config.type}`);
    }

    const adapter = new AdapterClass();
    this.adapters.set(config.id, adapter);
    this.configs.set(config.id, config);

    // Persist based on storage mode
    if (persist) {
      if (this.storageMode === 'cloud') {
        // Cloud mode: save to backend only, skip IndexedDB
        try {
          await this.syncAdapter.save(config);
        } catch (e) {
          console.error('[DataSourceManager] Failed to sync to cloud:', e);
          // Fallback: save locally so data is not lost
          set(`${STORAGE_KEY_PREFIX}${config.id}`, config).catch(() => {
            /* ignore */
          });
        }
      } else {
        // Local mode: save to IndexedDB
        set(`${STORAGE_KEY_PREFIX}${config.id}`, config).catch((e) => {
          console.error('[DataSourceManager] Failed to save to local storage:', e);
        });
      }
    }

    const existingStoreState = this.store?.getState().dataSources?.[config.id];
    const shouldWriteLifecycleState =
      Boolean(existingStoreState) || normalizedType !== 'PLATFORM_FIELD';
    // Avoid a synchronous "loading" write for first-time bootstrap registration.
    // Registering many datasources in one passive effect can otherwise trigger a long
    // chain of external-store rerenders and trip React's maximum update depth warning.
    if (shouldWriteLifecycleState) {
      this.store?.getState().setDataSourceState(config.id, {
        status: 'loading',
        lastUpdated: Date.now(),
      });
    }

    // Wire up adapter events to store
    adapter.onData((data) => {
      // Apply FieldMapping rules (DSP v2) if configured
      const fieldMappings =
        'fieldMappings' in config
          ? ((config as Record<string, unknown>).fieldMappings as FieldMappingConfig | undefined)
          : undefined;
      const processedData =
        fieldMappings && fieldMappings.rules && fieldMappings.rules.length > 0
          ? FieldMappingExecutor.apply(data, fieldMappings)
          : data;
      this.store?.getState().updateDataSourceData(config.id, processedData);
    });

    adapter.onError((error) => {
      if (shouldWriteLifecycleState) {
        this.store?.getState().setDataSourceState(config.id, {
          status: 'error',
          error: String(error),
          lastUpdated: Date.now(),
        });
      }
    });

    // Determine trigger mode: 'manual' data sources only prepare (no fetch/polling on load)
    const effectiveMode = this.resolveEffectiveMode(config, normalizedType);
    this.resolvedModes.set(config.id, effectiveMode);

    try {
      if (effectiveMode === 'manual') {
        await adapter.prepare(config);
        if (shouldWriteLifecycleState) {
          this.store?.getState().setDataSourceState(config.id, {
            status: 'idle',
            lastUpdated: Date.now(),
          });
        }
      } else {
        await adapter.connect(config);
        if (shouldWriteLifecycleState) {
          this.store?.getState().setDataSourceState(config.id, {
            status: 'connected',
            lastUpdated: Date.now(),
          });
        }
      }
    } catch (error) {
      if (shouldWriteLifecycleState) {
        this.store?.getState().setDataSourceState(config.id, {
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
          lastUpdated: Date.now(),
        });
      }
      throw error;
    }
  }

  /**
   * Disconnects and removes a data source.
   */
  public async unregisterDataSource(id: string): Promise<void> {
    const adapter = this.adapters.get(id);

    // Remove from persistent storage based on mode
    if (this.storageMode === 'cloud') {
      try {
        await this.syncAdapter.delete(id);
      } catch (e) {
        console.error('[DataSourceManager] Failed to delete from cloud:', e);
      }
    }
    // Always clean up IndexedDB (may have stale entry)
    del(`${STORAGE_KEY_PREFIX}${id}`).catch(() => {
      /* ignore */
    });

    if (adapter) {
      try {
        await adapter.disconnect();
      } catch (e) {
        console.error('[DataSourceManager] Failed to disconnect adapter:', e);
      }
      this.adapters.delete(id);
      this.configs.delete(id);
      this.resolvedModes.delete(id);
      // Fully remove from store — deleted data sources must not appear in FieldPicker
      this.store?.getState().removeDataSourceFromStore(id);
    }
  }

  public getAdapter(id: string): BaseAdapter | undefined {
    return this.adapters.get(id);
  }

  /**
   * Trigger an on-demand data re-fetch for a specific data source.
   * Used after write operations or when UI needs to force-refresh.
   *
   * @param id  Data source id to refresh
   */
  public async refreshDataSource(id: string): Promise<void> {
    const adapter = this.adapters.get(id);
    if (!adapter) return;
    try {
      await adapter.refresh();
    } catch (e) {
      console.error(`[DataSourceManager] refreshDataSource failed for '${id}':`, e);
    }
  }

  /**
   * Write a value to the specified data source adapter.
   * Used by ActionSystem `callWrite` action — widget emits → executeAction → writeDataSource.
   *
   * On success, automatically triggers a re-fetch on the SAME data source so the
   * dashboard displays the updated state (read-after-write).
   *
   * @param id       Data source id (as configured in the dashboard)
   * @param payload  Value or command to write (e.g. `true`, `42`, `{key:'on'}`).
   *                 The adapter decides how to serialise and transport this.
   * @returns        WriteResult with `success` flag and optional echo/error.
   */
  public async writeDataSource(id: string, payload: unknown): Promise<WriteResult> {
    const adapter = this.adapters.get(id);
    if (!adapter) {
      return { success: false, error: `[DataSourceManager] No adapter found for id: '${id}'` };
    }
    try {
      const result = await adapter.write(payload);
      // Auto-refresh after successful write — only for 'auto' mode data sources.
      // Manual (control) data sources share read/write URL; refreshing would
      // re-send the control command.
      if (result.success) {
        const mode = this.resolvedModes.get(id) ?? 'auto';
        if (mode === 'auto') {
          adapter.refresh().catch((e) => {
            console.error(`[DataSourceManager] post-write refresh failed for '${id}':`, e);
          });
        }
      }
      return result;
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      console.error(`[DataSourceManager] writeDataSource failed for '${id}':`, e);
      return { success: false, error: err };
    }
  }

  public getConfig(id: string): DataSource | undefined {
    return this.configs.get(id);
  }

  /**
   * Returns the effective trigger mode for a registered data source.
   * This accounts for smart inference (e.g. REST + POST + no polling → manual)
   * even when the persisted config has no explicit `mode` field.
   */
  public getResolvedMode(id: string): 'auto' | 'manual' {
    return this.resolvedModes.get(id) ?? 'auto';
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
    await Promise.all(ids.map((id) => this.unregisterDataSource(id)));
  }
}

/** @deprecated Use runtime.dataSourceManager from createRuntimeServices(). */
export const dataSourceManager = DataSourceManager.getInstance();
