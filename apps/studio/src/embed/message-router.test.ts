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
});
