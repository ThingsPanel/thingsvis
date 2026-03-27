import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProjectFile } from './schemas';
import { AutoSaveManager } from './autoSave';

function createProject(id = 'host-project'): ProjectFile {
  return {
    meta: {
      version: '1.0.0',
      id,
      name: 'Host Project',
      thumbnail: '',
      createdAt: 1,
      updatedAt: 1,
    },
    canvas: {
      mode: 'fixed',
      width: 1920,
      height: 1080,
    },
    nodes: [],
    dataSources: [],
    variables: [],
  };
}

describe('AutoSaveManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
    const windowMock = {
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
        const current = listeners.get(type) ?? new Set<EventListenerOrEventListenerObject>();
        current.add(listener);
        listeners.set(type, current);
      },
      removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
        listeners.get(type)?.delete(listener);
      },
    } as unknown as Window & typeof globalThis;

    vi.stubGlobal('window', windowMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('marks dirty without any automatic save in manual mode', async () => {
    const manager = new AutoSaveManager({
      debounceDelay: 50,
      periodicInterval: 50,
      warnOnUnload: false,
    });
    const saveFn = vi.fn(async (_project: ProjectFile) => {});

    manager.init('host-project', () => createProject(), saveFn, { mode: 'manual' });
    manager.markDirty();

    await vi.advanceTimersByTimeAsync(100);

    expect(saveFn).not.toHaveBeenCalled();
    expect(manager.getStatus().status).toBe('dirty');

    await manager.saveNow(true);

    expect(saveFn).toHaveBeenCalledTimes(1);
    expect(manager.getStatus().status).toBe('saved');

    manager.destroy();
  });

  it('notifies host-style dirty state transitions', async () => {
    const onDirtyChange = vi.fn();
    const manager = new AutoSaveManager({
      debounceDelay: 50,
      periodicInterval: 50,
      warnOnUnload: false,
      onDirtyChange,
    });
    const saveFn = vi.fn(async (_project: ProjectFile) => {});

    manager.init('host-project', () => createProject(), saveFn, { mode: 'manual' });
    manager.markDirty();
    await manager.saveNow(true);

    expect(onDirtyChange).toHaveBeenNthCalledWith(1, false);
    expect(onDirtyChange).toHaveBeenNthCalledWith(2, true);
    expect(onDirtyChange).toHaveBeenNthCalledWith(3, false);

    manager.destroy();
  });

  it('does not spam duplicate dirty notifications before the state flips', async () => {
    const onDirtyChange = vi.fn();
    const manager = new AutoSaveManager({
      debounceDelay: 50,
      periodicInterval: 50,
      warnOnUnload: false,
      onDirtyChange,
    });
    const saveFn = vi.fn(async (_project: ProjectFile) => {});

    manager.init('host-project', () => createProject(), saveFn, { mode: 'manual' });
    manager.markDirty();
    manager.markDirty();
    await manager.saveNow(true);
    await manager.saveNow(true);

    expect(onDirtyChange.mock.calls).toEqual([[false], [true], [false]]);

    manager.destroy();
  });
});
