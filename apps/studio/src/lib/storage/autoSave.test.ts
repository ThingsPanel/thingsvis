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
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
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
});
