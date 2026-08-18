import { describe, expect, it } from 'vitest';
import { ApiSyncAdapter, isHostManagedDataSourceId } from './DataSourceSync';

describe('isHostManagedDataSourceId', () => {
  it('matches generated host sources without matching user-created sources', () => {
    expect(isHostManagedDataSourceId('thingspanel_home_alarm_history')).toBe(true);
    expect(isHostManagedDataSourceId('__platform_device-1__')).toBe(true);
    expect(isHostManagedDataSourceId('custom_rest')).toBe(false);
    expect(isHostManagedDataSourceId(undefined)).toBe(false);
  });
});

describe('ApiSyncAdapter', () => {
  it('filters and prunes leaked generated platform datasources from cloud loads', async () => {
    const deleted: string[] = [];
    const adapter = new ApiSyncAdapter({
      get: async () => ({
        success: true,
        data: [
          {
            id: '__platform_dev-1__',
            name: 'Device 1',
            type: 'PLATFORM_FIELD',
            config: { source: 'platform', deviceId: 'dev-1' },
          },
          {
            id: 'custom_rest',
            name: 'Custom REST',
            type: 'REST',
            config: { url: '/custom' },
          },
          {
            id: 'thingspanel_device_summary',
            name: 'thingspanel_device_summary',
            type: 'REST',
            config: { url: '/board/tenant/device/info' },
          },
        ],
      }),
      post: async () => ({ success: true }),
      put: async () => ({ success: true }),
      delete: async (path) => {
        deleted.push(path);
        return { success: true };
      },
    });

    const loaded = await adapter.loadAll();

    expect(loaded.map((source) => source.id)).toEqual(['custom_rest']);
    expect(deleted).toEqual([
      '/datasources/__platform_dev-1__',
      '/datasources/thingspanel_device_summary',
    ]);
  });
});
