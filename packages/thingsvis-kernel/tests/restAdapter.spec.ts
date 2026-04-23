import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RESTConfigSchema, type DataSource } from '@thingsvis/schema';
import { RESTAdapter } from '../src/datasources/RESTAdapter';
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

describe('RESTAdapter runtime variables', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('allows template URLs in REST config schema', () => {
    const parsed = RESTConfigSchema.parse({
      url: '{{ var.platformApiBaseUrl }}/devices/{{ var.deviceId }}/telemetry',
      method: 'GET',
    });

    expect(parsed.url).toBe('{{ var.platformApiBaseUrl }}/devices/{{ var.deviceId }}/telemetry');
  });

  it('resolves URL, headers, and GET params from runtime variables', async () => {
    const fetchMock = mockJsonFetch({ temperature: 26 });
    const adapter = new RESTAdapter();

    await adapter.refreshWithVariables({
      platformApiBaseUrl: 'https://platform.example.com',
      deviceId: 'device-001',
      token: 'abc',
      page: 2,
    });

    await adapter.connect({
      id: 'rest-telemetry',
      name: 'Telemetry',
      type: 'REST',
      config: {
        url: '{{ var.platformApiBaseUrl }}/api/devices/{{ var.deviceId }}/telemetry',
        method: 'GET',
        headers: {
          Authorization: 'Bearer {{ var.token }}',
        },
        params: {
          page: '{{ var.page }}',
          fields: ['temperature', '{{ var.deviceId }}'],
        },
      },
    } as DataSource);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    const parsedUrl = new URL(String(url));
    expect(parsedUrl.origin).toBe('https://platform.example.com');
    expect(parsedUrl.pathname).toBe('/api/devices/device-001/telemetry');
    expect(parsedUrl.searchParams.get('page')).toBe('2');
    expect(parsedUrl.searchParams.getAll('fields')).toEqual(['temperature', 'device-001']);
    expect((options as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer abc',
    });
  });

  it('uses current store variable values for the first manager-registered REST request', async () => {
    const fetchMock = mockJsonFetch({ status: 'online' });
    const useStore = createKernelStore();
    const manager = new DataSourceManager();
    (manager as any).store = useStore;

    useStore.getState().setVariableDefinitions([
      { name: 'platformApiBaseUrl', type: 'string', defaultValue: 'https://platform.example.com' },
      { name: 'deviceId', type: 'string', defaultValue: 'device-001' },
    ] as any);
    useStore.getState().initVariablesFromDefinitions(useStore.getState().variableDefinitions);

    await manager.registerDataSource(
      {
        id: 'rest-status',
        name: 'Status',
        type: 'REST',
        config: {
          url: '{{ var.platformApiBaseUrl }}/api/devices/{{ var.deviceId }}/status',
          method: 'GET',
        },
      } as DataSource,
      false,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'https://platform.example.com/api/devices/device-001/status',
    );
  });
});
