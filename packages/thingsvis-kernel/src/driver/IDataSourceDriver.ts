export interface SubscribeOptions {
  targetProp: string;
  sourcePath?: string;
  interval?: number;
}

export interface IDataSourceDriver {
  /** Uniquely identifies this driver type (e.g., 'my-platform') */
  readonly driverId: string;

  /** Human-readable name for the UI */
  readonly name: string;

  /** Initialize connection with the platform */
  connect(config: Record<string, unknown>): Promise<void>;

  /**
   * Subscribe to specific data fields.
   * Returns a cleanup/unsubscribe function.
   */
  subscribe(options: SubscribeOptions, callback: (data: unknown) => void): () => void;

  /** Send reverse control commands back to the platform */
  executeCommand(command: string, payload: unknown): Promise<void>;

  /** Clean up and disconnect */
  disconnect(): Promise<void>;
}
