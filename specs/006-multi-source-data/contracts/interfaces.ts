/**
 * @file interfaces.ts
 * Core interfaces for the Data Source Integration feature.
 * Located at: specs/006-multi-source-data/contracts/interfaces.ts
 */

export type DataSourceType = 'REST' | 'WS' | 'MQTT' | 'STATIC';

export interface IDataSourceConfig {
  id: string;
  name: string;
  type: DataSourceType;
  config: Record<string, any>;
  transformation?: string;
}

export interface IDataSourceState {
  data: any;
  status: 'connected' | 'disconnected' | 'error' | 'loading';
  error?: string;
  lastUpdated: number;
}

/**
 * Interface for Data Source Adapters in the Kernel
 */
export interface IDataSourceAdapter {
  type: DataSourceType;
  connect(config: IDataSourceConfig): Promise<void>;
  disconnect(): Promise<void>;
  onData(callback: (data: any) => void): void;
  onError(callback: (error: any) => void): void;
  executeTransformation(data: any, script: string): any;
}

/**
 * Global Manager for Data Sources in the Kernel
 */
export interface IDataSourceManager {
  register(config: IDataSourceConfig): void;
  unregister(id: string): void;
  getDataSource(id: string): IDataSourceAdapter | undefined;
  getAllStates(): Record<string, IDataSourceState>;
}

/**
 * UI Hook for components to bind to data
 */
export interface IUseDataSourceResult {
  data: any;
  isLoading: boolean;
  error: any;
  status: string;
}

