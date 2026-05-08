import { afterEach, describe, expect, it, vi } from 'vitest';

describe('message-router host notifications', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('sends tv:change to the host in embedded mode', async () => {
    const postMessage = vi.fn();
    const hostWindow = { postMessage };
    const windowMock = {
      parent: hostWindow,
      location: {
        hash: '#/editor/demo?mode=embedded&saveTarget=host',
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window & typeof globalThis;

    vi.stubGlobal('window', windowMock);

    const { notifyChange } = await import('./message-router');
    notifyChange(false);

    expect(postMessage).toHaveBeenCalledWith(
      {
        type: 'tv:change',
        payload: { hasUnsavedChanges: false },
        source: 'thingsvis',
        tvVersion: '2.0.0',
      },
      '*',
    );
  });

  it('preserves layer node names and layer metadata from host init payload', async () => {
    vi.stubGlobal('window', {
      parent: { postMessage: vi.fn() },
      location: {
        hash: '#/editor/demo?mode=embedded&saveTarget=host',
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window & typeof globalThis);

    const { processEmbedInitPayload } = await import('./message-router');
    const processed = processEmbedInitPayload({
      data: {
        meta: { id: 'dashboard-1', name: 'Dashboard' },
        canvas: {
          mode: 'fixed',
          width: 1920,
          height: 1080,
          layerOrder: ['node-1'],
          layerGroups: {
            'group-1': {
              id: 'group-1',
              name: 'Group 1',
              expanded: true,
              locked: false,
              visible: true,
              memberIds: ['node-1'],
            },
          },
        },
        nodes: [
          {
            id: 'node-1',
            type: 'basic/text',
            name: '自定义图层名',
            position: { x: 0, y: 0 },
            size: { width: 100, height: 40 },
          },
        ],
      },
      config: { saveTarget: 'host' },
    });

    expect(processed?.nodes[0]?.name).toBe('自定义图层名');
    expect(processed?.canvas.layerOrder).toEqual(['node-1']);
    expect(processed?.canvas.layerGroups?.['group-1']).toMatchObject({
      name: 'Group 1',
      memberIds: ['node-1'],
    });
  });
});
