import { DataSource, StaticConfigSchema } from '@thingsvis/schema';
import { BaseAdapter } from './BaseAdapter';

/**
 * StaticAdapter: Handles manual/static JSON data.
 * Useful for mocking and prototyping.
 */
export class StaticAdapter extends BaseAdapter {
  constructor() {
    super('STATIC');
  }

  public async connect(config: DataSource): Promise<void> {
    this.config = config;
    
    // Validate static config
    const result = StaticConfigSchema.safeParse(config.config);
    if (!result.success) {
      throw new Error(`[StaticAdapter] Invalid static config: ${result.error.message}`);
    }

    // Emit the static value immediately
    this.emitData(result.data.value);
  }

  public async disconnect(): Promise<void> {
    // Nothing to disconnect for static data
    this.config = undefined;
  }
}

