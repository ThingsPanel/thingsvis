import { DataSource, DataSourceType } from '@thingsvis/schema';
import { SafeExecutor } from '../sandbox/SafeExecutor';

/**
 * Result of a write operation to a data source.
 */
export interface WriteResult {
  success: boolean;
  /** Echo value confirmed by the device/service, used for optimistic update validation. */
  echo?: unknown;
  /** Human-readable error message on failure. */
  error?: string;
}

/**
 * Base class for all data source adapters.
 * Handles common functionality like transformations and callback management.
 */
export abstract class BaseAdapter {
  protected config?: DataSource;
  protected currentData: unknown = null;
  protected dataCallbacks: Set<(data: unknown) => void> = new Set();
  protected errorCallbacks: Set<(error: unknown) => void> = new Set();

  constructor(public readonly type: DataSourceType) {}

  /**
   * Establishes connection and starts receiving data.
   */
  public abstract connect(config: DataSource): Promise<void>;

  /**
   * Closes connection and stops receiving data.
   */
  public abstract disconnect(): Promise<void>;

  /**
   * Prepare the adapter with config but do NOT start fetching or polling.
   * Used for 'manual' mode data sources that only serve as write targets.
   * Override in adapters that need to parse/store config before write() is called.
   * Default implementation stores the config reference.
   */
  public async prepare(config: DataSource): Promise<void> {
    this.config = config;
  }

  /**
   * Trigger an on-demand data re-fetch (e.g. after a successful write).
   * Override in adapters that support active data retrieval.
   * Default implementation is a no-op.
   */
  public async refresh(): Promise<void> {
    // no-op by default
  }

  /**
   * Re-fetch / re-connect with resolved variable values substituted into the config.
   * Override in adapters that support {{ var.xxx }} expressions in their config (e.g. REST URL).
   * Default implementation is a no-op (used for WebSocket, Static, etc.).
   *
   * @param variableValues Current snapshot of dashboard variable values
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async refreshWithVariables(_variableValues: Record<string, unknown>): Promise<void> {
    // no-op by default
  }

  /**
   * Write a value to the data source (bidirectional channel).
   * Used by interactive widgets (Switch, Button, Slider) via ActionSystem callWrite.
   * Override in adapters that support write operations (REST POST, WS send, MQTT publish).
   * Default implementation returns an error indicating write is unsupported.
   *
   * @param payload  The value or command to write (e.g. `true`, `42`, `{key:'on',val:1}`)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async write(_payload: unknown): Promise<WriteResult> {
    return {
      success: false,
      error: `Adapter type '${this.type}' does not support write operations`,
    };
  }

  public onData(callback: (data: unknown) => void): void {
    this.dataCallbacks.add(callback);
    // Send current data immediately if available
    if (this.currentData !== null) {
      callback(this.currentData);
    }
  }

  public offData(callback: (data: unknown) => void): void {
    this.dataCallbacks.delete(callback);
  }

  public onError(callback: (error: unknown) => void): void {
    this.errorCallbacks.add(callback);
  }

  public offError(callback: (error: unknown) => void): void {
    this.errorCallbacks.delete(callback);
  }

  /**
   * Processes raw data through the transformation sandbox and notifies listeners.
   */
  protected emitData(rawData: unknown): void {
    let finalData = rawData;
    if (this.config?.transformation) {
      finalData = SafeExecutor.execute(this.config.transformation, rawData);
    }
    this.currentData = finalData;
    this.dataCallbacks.forEach((cb) => cb(finalData));
  }

  protected emitError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.errorCallbacks.forEach((cb) => cb(message));
  }

  public getData(): unknown {
    return this.currentData;
  }
}
