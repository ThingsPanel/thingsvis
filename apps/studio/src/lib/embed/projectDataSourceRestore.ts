import { dataSourceManager } from '../store';
import type { DataSource } from '@thingsvis/schema';

export async function restoreProjectDataSources(dataSources: unknown): Promise<void> {
  if (!Array.isArray(dataSources)) return;

  for (const dataSource of dataSources) {
    try {
      await dataSourceManager.registerDataSource(dataSource as DataSource, false);
    } catch (error) {
      const id = (dataSource as { id?: unknown } | null)?.id;
      console.warn(`[Editor] Failed to restore data source ${String(id ?? '')}:`, error);
    }
  }
}
