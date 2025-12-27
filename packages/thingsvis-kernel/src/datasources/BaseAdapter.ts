import { DataSource, DataSourceType } from '@thingsvis/schema';
import { SafeExecutor } from '../sandbox/SafeExecutor';

/**
 * Base class for all data source adapters.
 * Handles common functionality like transformations and callback management.
 */
export abstract class BaseAdapter {
  protected config?: DataSource;
  protected currentData: any = null;
  protected dataCallbacks: Set<(data: any) => void> = new Set();
  protected errorCallbacks: Set<(error: any) => void> = new Set();

  constructor(public readonly type: DataSourceType) {}

  /**
   * Establishes connection and starts receiving data.
   */
  public abstract connect(config: DataSource): Promise<void>;

  /**
   * Closes connection and stops receiving data.
   */
  public abstract disconnect(): Promise<void>;

  public onData(callback: (data: any) => void): void {
    this.dataCallbacks.add(callback);
    // Send current data immediately if available
    if (this.currentData !== null) {
      callback(this.currentData);
    }
  }

  public offData(callback: (data: any) => void): void {
    this.dataCallbacks.delete(callback);
  }

  public onError(callback: (error: any) => void): void {
    this.errorCallbacks.add(callback);
  }

  public offError(callback: (error: any) => void): void {
    this.errorCallbacks.delete(callback);
  }

  /**
   * Processes raw data through the transformation sandbox and notifies listeners.
   */
  protected emitData(rawData: any): void {
    let finalData = rawData;
    if (this.config?.transformation) {
      finalData = SafeExecutor.execute(this.config.transformation, rawData);
    }
    this.currentData = finalData;
    this.dataCallbacks.forEach(cb => cb(finalData));
  }

  protected emitError(error: any): void {
    const message = error instanceof Error ? error.message : String(error);
    this.errorCallbacks.forEach(cb => cb(message));
  }

  public getData(): any {
    return this.currentData;
  }
}

