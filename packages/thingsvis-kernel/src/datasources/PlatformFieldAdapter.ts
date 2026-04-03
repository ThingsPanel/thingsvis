import { BaseAdapter } from './BaseAdapter';
import type { WriteResult } from './BaseAdapter';
import type { DataSource, PlatformFieldConfig } from '@thingsvis/schema';

/**
 * Platform Field Adapter
 * Adapts platform-provided fields (e.g., host platform device attributes/telemetry)
 * to ThingsVis data source format
 */
export class PlatformFieldAdapter extends BaseAdapter {
  private fieldMappings: Record<string, string> = {};
  private platformDataCache: Map<string, { value: unknown; timestamp: number }> = new Map();
  /** Rolling time-series buffers — populated only when bufferSize > 0. */
  private dataBuffers: Map<string, Array<{ value: unknown; ts: number }>> = new Map();
  private messageListener: ((event: MessageEvent) => void) | null = null;

  constructor() {
    super('PLATFORM_FIELD');
  }

  async connect(config: DataSource): Promise<void> {
    if (config.type !== 'PLATFORM_FIELD') {
      throw new Error('PlatformFieldAdapter requires PLATFORM_FIELD type');
    }

    this.config = config;
    const platformConfig = config.config as PlatformFieldConfig;
    this.fieldMappings = platformConfig.fieldMappings;

    // Subscribe to platform data push
    this.subscribeToHostData();

    // Request initial data from host
    this.requestInitialData();
  }

  /**
   * Subscribe to platform data updates via postMessage.
   * Each push updates the single-point cache and — when bufferSize > 0 — appends
   * to a per-field ring buffer exposed as '{fieldId}__history'.
   */
  private subscribeToHostData() {
    this.messageListener = (event: MessageEvent) => {
      // Security: In production, verify event.origin against the known ThingsVis origin.
      const msgType: unknown = event.data?.type;

      // ── Bulk history pre-fill ────────────────────────────────────────────────
      if (msgType === 'tv:platform-history') {
        const { fieldId, history, deviceId } = event.data.payload as {
          fieldId: string;
          history: Array<{ value: unknown; ts: number }>;
          deviceId?: string;
        };
        // 若 Adapter 配置了专属 deviceId，但消息中的 deviceId 不匹配，忽略该消息
        const historyPlatformConfig = this.config?.config as PlatformFieldConfig | undefined;
        // Strict routing:
        // - device-scoped datasource: only accept matching deviceId
        // - global datasource (__platform__): only accept messages without deviceId
        if (historyPlatformConfig?.deviceId) {
          if (historyPlatformConfig.deviceId !== deviceId) return;
        } else if (deviceId !== undefined) {
          return;
        }

        if (!fieldId || !Array.isArray(history)) return;

        const bufferSize = historyPlatformConfig?.bufferSize ?? 0;
        if (bufferSize > 0) {
          // Retain at most the last bufferSize entries (oldest entries are dropped).
          const merged = history.slice(-bufferSize).map((item) => ({
            value: item.value,
            ts: item.ts,
          }));
          this.dataBuffers.set(fieldId, merged);
          // Keep single-point cache consistent with the latest history entry.
          const last = merged[merged.length - 1];
          if (last !== undefined) {
            this.platformDataCache.set(fieldId, { value: last.value, timestamp: last.ts });
          }
          this.updateData();
        }
        return;
      }

      // ── Real-time single-point push ──────────────────────────────────────────
      if (msgType !== 'tv:platform-data') return;
      const { fieldId, value, timestamp, fields, deviceId } = event.data.payload as {
        fieldId?: string;
        value?: unknown;
        timestamp?: number;
        fields?: Record<string, unknown>; // 批量字段推送
        deviceId?: string;
      };

      const platformConfig = this.config?.config as PlatformFieldConfig | undefined;
      // Strict routing:
      // - device-scoped datasource: only accept matching deviceId
      // - global datasource (__platform__): only accept messages without deviceId
      if (platformConfig?.deviceId) {
        if (platformConfig.deviceId !== deviceId) return;
      } else if (deviceId !== undefined) {
        return;
      }

      const ts = timestamp ?? Date.now();
      const updates = fields
        ? Object.entries(fields)
        : fieldId !== undefined
          ? ([[fieldId, value]] as const)
          : [];

      let hasUpdates = false;
      for (const [key, val] of updates) {
        hasUpdates = true;
        // Update single-point cache (backward-compatible with all existing bindings)
        this.platformDataCache.set(key, { value: val, timestamp: ts });

        // Ring buffer — only when configured
        const bufferSize = platformConfig?.bufferSize ?? 0;
        if (bufferSize > 0) {
          const existingBuffer = this.dataBuffers.get(key);
          const buf = existingBuffer ? [...existingBuffer] : [];
          buf.push({ value: val, ts });
          if (buf.length > bufferSize) buf.splice(0, buf.length - bufferSize);
          this.dataBuffers.set(key, buf);
        }
      }

      if (hasUpdates) {
        this.updateData();
      }
    };

    window.addEventListener('message', this.messageListener);
  }

  /**
   * Request initial field data from host platform
   */
  private requestInitialData() {
    const platformConfig = this.config?.config as PlatformFieldConfig | undefined;
    const fieldIds = Array.from(
      new Set([...Object.values(this.fieldMappings), ...(platformConfig?.requestedFields ?? [])]),
    );

    if (fieldIds.length > 0) {
      window.parent.postMessage(
        {
          type: 'thingsvis:requestFieldData',
          payload: {
            dataSourceId: this.config?.id,
            deviceId: platformConfig?.deviceId,
            fieldIds,
          },
        },
        '*',
      );
    }
  }

  private resolveSingleWriteFieldId(): string | null {
    const platformConfig = this.config?.config as PlatformFieldConfig | undefined;
    const fieldCandidates = new Set<string>();

    Object.values(this.fieldMappings ?? {}).forEach((fieldId) => {
      if (typeof fieldId === 'string' && fieldId.trim()) {
        fieldCandidates.add(fieldId.trim());
      }
    });

    (platformConfig?.requestedFields ?? []).forEach((fieldId) => {
      if (typeof fieldId === 'string' && fieldId.trim()) {
        fieldCandidates.add(fieldId.trim());
      }
    });

    if (fieldCandidates.size === 1) {
      return Array.from(fieldCandidates)[0] ?? null;
    }

    if (fieldCandidates.size === 0 && this.platformDataCache.size === 1) {
      return Array.from(this.platformDataCache.keys())[0] ?? null;
    }

    return null;
  }

  private normalizeWritePayload(payload: unknown): unknown {
    if (!this.config) return payload;

    const singleFieldId = this.resolveSingleWriteFieldId();
    if (!singleFieldId) return payload;

    if (payload !== null && typeof payload === 'object') {
      return payload;
    }

    return {
      [singleFieldId]: payload,
    };
  }

  /**
   * Write a value back to the host platform via the standard protocol message.
   * The host platform maps dataSourceId to the concrete device and API.
   */
  public override async write(payload: unknown): Promise<WriteResult> {
    if (!this.config) {
      return { success: false, error: 'PlatformFieldAdapter is not connected' };
    }
    try {
      const platformConfig = this.config.config as PlatformFieldConfig | undefined;
      const normalizedPayload = this.normalizeWritePayload(payload);
      window.parent.postMessage(
        {
          type: 'tv:platform-write',
          payload: {
            dataSourceId: this.config.id,
            deviceId: platformConfig?.deviceId,
            data: normalizedPayload,
          },
        },
        '*',
      );
      return { success: true };
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      console.error('[PlatformFieldAdapter] write postMessage failed:', e);
      return { success: false, error: err };
    }
  }

  /**
   * Rebuild the data snapshot and emit it to all subscribers.
   * Exposes single-point values and — when bufferSize > 0 — rolling history arrays
   * under the '{fieldId}__history' key (double-underscore avoids collisions).
   */
  private updateData() {
    const platformConfig = this.config?.config as PlatformFieldConfig | undefined;
    const bufferSize = platformConfig?.bufferSize ?? 0;
    const allData: Record<string, unknown> = {};

    // 1. Single-point values (backward-compatible with all existing bindings)
    for (const [fieldId, data] of this.platformDataCache.entries()) {
      allData[fieldId] = data.value;

      // 2. History array (only when ring buffer is active)
      // IMPORTANT: Shallow-copy the buffer array so the Immer middleware in the
      // Zustand store doesn't freeze our internal mutable ring buffer reference.
      if (bufferSize > 0) {
        allData[`${fieldId}__history`] = [...(this.dataBuffers.get(fieldId) ?? [])];
      }
    }

    // 3. Apply explicit fieldMappings (legacy support)
    if (this.fieldMappings && Object.keys(this.fieldMappings).length > 0) {
      for (const [componentProp, fieldId] of Object.entries(this.fieldMappings)) {
        const fieldData = this.platformDataCache.get(fieldId);
        if (fieldData) {
          allData[componentProp] = fieldData.value;
        }
      }
    }

    this.emitData(allData);
  }

  /**
   * Manually set field data (for testing or runtime updates)
   */
  public setFieldData(fieldId: string, value: unknown) {
    this.platformDataCache.set(fieldId, {
      value,
      timestamp: Date.now(),
    });
    this.updateData();
  }

  /**
   * Get current cached data
   */
  public getCachedData(): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (const [prop, fieldId] of Object.entries(this.fieldMappings)) {
      const fieldData = this.platformDataCache.get(fieldId);
      if (fieldData) {
        data[prop] = fieldData.value;
      }
    }
    return data;
  }

  async disconnect(): Promise<void> {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }
    this.platformDataCache.clear();
    this.dataBuffers.clear();
  }
}
