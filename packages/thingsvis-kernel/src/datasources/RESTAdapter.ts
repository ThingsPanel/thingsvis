import { DataSource, RESTConfigSchema } from '@thingsvis/schema';
import { BaseAdapter } from './BaseAdapter';

/**
 * RESTAdapter: Handles standard REST API data fetching with polling support.
 */
export class RESTAdapter extends BaseAdapter {
  private timer?: any;

  constructor() {
    super('REST');
  }

  public async connect(config: DataSource): Promise<void> {
    this.config = config;
    const restConfig = RESTConfigSchema.parse(config.config);

    await this.fetchData(restConfig);

    if (restConfig.pollingInterval && restConfig.pollingInterval > 0) {
      this.timer = setInterval(() => {
        this.fetchData(restConfig);
      }, restConfig.pollingInterval);
    }
  }

  private async fetchData(config: any) {
    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.method !== 'GET' ? JSON.stringify(config.params) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawData = await response.json();
      this.emitData(rawData);
    } catch (e) {
      this.emitError(e);
    }
  }

  public async disconnect(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    this.config = undefined;
  }
}

