import { describe, expect, it, vi } from 'vitest';

const dashboardsApi = vi.hoisted(() => ({
  updateDashboard: vi.fn(),
  createDashboard: vi.fn(),
  getDashboard: vi.fn(),
  listDashboards: vi.fn(),
  deleteDashboard: vi.fn(),
}));

vi.mock('../../api/dashboards', () => dashboardsApi);

import { createCloudStorageAdapter } from './cloudAdapter';

describe('cloud dashboard optimistic concurrency', () => {
  it('sends the loaded revision and returns the next revision', async () => {
    dashboardsApi.updateDashboard.mockResolvedValue({
      data: { id: 'dashboard-1', version: 8 },
    });

    const adapter = createCloudStorageAdapter();
    const result = await adapter.save({
      meta: {
        id: 'dashboard-1',
        name: 'Dashboard',
        revision: 7,
        createdAt: 1,
        updatedAt: 2,
      },
      schema: {
        canvas: { mode: 'fixed', width: 100, height: 100 },
        nodes: [{ id: 'new-node' }],
        dataSources: [],
        variables: [],
      },
    });

    expect(dashboardsApi.updateDashboard).toHaveBeenCalledWith(
      'dashboard-1',
      expect.objectContaining({ expectedVersion: 7, nodes: [{ id: 'new-node' }] }),
    );
    expect(result).toEqual({ id: 'dashboard-1', revision: 8 });
  });
});
