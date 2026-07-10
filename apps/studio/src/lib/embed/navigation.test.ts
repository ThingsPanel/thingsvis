import { describe, expect, it, vi } from 'vitest';

import { buildHashRoute, getHashQueryParams, openDataSources } from './navigation';

describe('embed navigation helpers', () => {
  it('preserves current embed params when opening preview', () => {
    const result = buildHashRoute('#/preview', {
      preserveCurrentParams: true,
      currentHash: '#/editor/dashboard-1?mode=embedded&saveTarget=host&showToolbar=0&token=abc',
      params: { projectId: 'dashboard-1' },
    });

    const [path, query = ''] = result.split('?');
    const params = new URLSearchParams(query);

    expect(path).toBe('#/preview');
    expect(params.get('mode')).toBe('embedded');
    expect(params.get('saveTarget')).toBe('host');
    expect(params.get('showToolbar')).toBe('0');
    expect(params.get('token')).toBe('abc');
    expect(params.get('projectId')).toBe('dashboard-1');
  });

  it('drops query projectId when returning to editor path', () => {
    const result = buildHashRoute('#/editor/dashboard-1', {
      preserveCurrentParams: true,
      currentHash: '#/preview?projectId=dashboard-1&mode=embedded&saveTarget=host&showProps=0',
      params: { projectId: null },
    });

    const [path, query = ''] = result.split('?');
    const params = new URLSearchParams(query);

    expect(path).toBe('#/editor/dashboard-1');
    expect(params.get('projectId')).toBeNull();
    expect(params.get('mode')).toBe('embedded');
    expect(params.get('saveTarget')).toBe('host');
    expect(params.get('showProps')).toBe('0');
  });

  it('parses hash query params safely when no query exists', () => {
    expect(getHashQueryParams('#/editor/dashboard-1').toString()).toBe('');
  });

  it('opens embedded data sources without saving and clears resumeSession', () => {
    const location = { hash: '' };
    const openWindow = vi.fn();
    const saveNow = vi.fn();
    const sendToHost = vi.fn();

    openDataSources({
      isEmbedded: true,
      projectId: 'dashboard-1',
      currentHash:
        '#/editor/dashboard-1?mode=embedded&saveTarget=host&context=device-template&resumeSession=1',
      location,
      openWindow,
    });

    const [path, query = ''] = location.hash.split('?');
    const params = new URLSearchParams(query);

    expect(path).toBe('#/data-sources');
    expect(params.get('mode')).toBe('embedded');
    expect(params.get('saveTarget')).toBe('host');
    expect(params.get('context')).toBe('device-template');
    expect(params.get('projectId')).toBe('dashboard-1');
    expect(params.get('resumeSession')).toBeNull();
    expect(openWindow).not.toHaveBeenCalled();
    expect(saveNow).not.toHaveBeenCalled();
    expect(sendToHost).not.toHaveBeenCalled();
  });

  it('opens standalone data sources in a new window without changing the hash', () => {
    const location = { hash: '#/editor/dashboard-1' };
    const openWindow = vi.fn();

    openDataSources({
      isEmbedded: false,
      projectId: 'dashboard-1',
      currentHash: location.hash,
      location,
      openWindow,
    });

    expect(location.hash).toBe('#/editor/dashboard-1');
    expect(openWindow).toHaveBeenCalledWith('#/data-sources', '_blank');
  });
});
