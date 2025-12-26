import { DataSource, WSConfigSchema } from '@thingsvis/schema';
import { BaseAdapter } from './BaseAdapter';

/**
 * WSAdapter: Handles real-time data via WebSockets.
 */
export class WSAdapter extends BaseAdapter {
  private socket?: WebSocket;

  constructor() {
    super('WS');
  }

  public async connect(config: DataSource): Promise<void> {
    this.config = config;
    const wsConfig = WSConfigSchema.parse(config.config);

    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(wsConfig.url, wsConfig.protocols);

        this.socket.onopen = () => {
          console.log(`[WSAdapter] Connected to ${wsConfig.url}`);
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const rawData = JSON.parse(event.data);
            this.emitData(rawData);
          } catch (e) {
            // If not JSON, emit as string
            this.emitData(event.data);
          }
        };

        this.socket.onerror = (error) => {
          this.emitError(error);
          reject(error);
        };

        this.socket.onclose = () => {
          console.log(`[WSAdapter] Closed connection to ${wsConfig.url}`);
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  public async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }
  }
}

