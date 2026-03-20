import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearEmbedSessionSnapshot,
  getEmbedSessionSnapshot,
  setEmbedSessionSnapshot,
} from './sessionSnapshot';
import type { ProjectFile } from '../storage/schemas';

function createProject(id: string): ProjectFile {
  return {
    meta: {
      id,
      name: `Project ${id}`,
      version: '1.0.0',
      createdAt: 1,
      updatedAt: 2,
    },
    canvas: {
      mode: 'fixed',
      width: 1920,
      height: 1080,
      background: '#000000',
    },
    nodes: [],
    dataSources: [],
    variables: [],
  };
}

describe('embed session snapshot', () => {
  beforeEach(() => {
    clearEmbedSessionSnapshot();
  });

  it('returns the latest snapshot for the same project id', () => {
    setEmbedSessionSnapshot('host-1', createProject('host-1'), 'host-save');

    const snapshot = getEmbedSessionSnapshot('host-1');

    expect(snapshot?.projectId).toBe('host-1');
    expect(snapshot?.source).toBe('host-save');
    expect(snapshot?.project.meta.name).toBe('Project host-1');
  });

  it('does not return snapshot for a different project id', () => {
    setEmbedSessionSnapshot('host-1', createProject('host-1'), 'host-init');

    expect(getEmbedSessionSnapshot('host-2')).toBeNull();
  });

  it('uses the latest snapshot as fallback for embed-host bootstrap', () => {
    setEmbedSessionSnapshot('host-1', createProject('host-1'), 'host-init');

    const snapshot = getEmbedSessionSnapshot('embed-host');

    expect(snapshot?.projectId).toBe('host-1');
  });
});
