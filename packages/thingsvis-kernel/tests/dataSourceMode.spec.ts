import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DataSource } from '@thingsvis/schema';
import { DataSourceManager } from '../src/datasources/DataSourceManager';
import { createKernelStore } from '../src/store/KernelStore';

function mockJsonFetch(body: unknown = { ok: true }) {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    json: async () => body,
  })) as unknown as typeof fetch;
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock as unknown as ReturnType<typeof vi.fn>;
}

describe('DataSourceManager trigger mode', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('defaults REST POST sources without explicit mode to auto', async () => {
    const fetchMock = mockJsonFetch({ rows: [] });
    const manager = new DataSourceManager();
    (manager as any).store = createKernelStore();

    await manager.registerDataSource(
      {
        id: 'post_query',
        name: 'Post Query',
        type: 'REST',
        config: {
          url: 'https://example.com/api/query',
          method: 'POST',
          pollingInterval: 0,
        },
      } as DataSource,
      false,
    );

    expect(manager.getResolvedMode('post_query')).toBe('auto');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps explicitly manual sources as manual', async () => {
    const fetchMock = mockJsonFetch();
    const manager = new DataSourceManager();
    (manager as any).store = createKernelStore();

    await manager.registerDataSource(
      {
        id: 'write_command',
        name: 'Write Command',
        type: 'REST',
        mode: 'manual',
        config: {
          url: 'https://example.com/api/command',
          method: 'POST',
          pollingInterval: 0,
        },
      } as DataSource,
      false,
    );

    expect(manager.getResolvedMode('write_command')).toBe('manual');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
