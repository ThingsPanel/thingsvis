import { describe, expect, it, afterEach } from 'vitest';
import {
  getBackendProjectIdFromEditorUrl,
  getDashboardIdFromEditorUrl,
  getMergedEditorUrlParams,
  isEmbeddedEditorUrl,
} from './editorUrlParams';

const setUrl = (url: string) => {
  window.history.replaceState({}, '', url);
};

describe('editor URL params', () => {
  afterEach(() => {
    setUrl('/');
  });

  it('reads ThingsPanel editor ids from normal query params', () => {
    setUrl('/visualization/thingsvis-editor?id=dashboard-1&projectId=backend-project-1');

    expect(getDashboardIdFromEditorUrl()).toBe('dashboard-1');
    expect(getBackendProjectIdFromEditorUrl()).toBe('backend-project-1');
  });

  it('lets hash route params override normal query params', () => {
    setUrl(
      '/?id=query-dashboard&projectId=query-project#/editor/hash-dashboard?projectId=hash-dashboard&backendProjectId=hash-project',
    );

    expect(getDashboardIdFromEditorUrl()).toBe('hash-dashboard');
    expect(getBackendProjectIdFromEditorUrl()).toBe('hash-project');
    expect(getMergedEditorUrlParams().get('projectId')).toBe('hash-dashboard');
  });

  it('detects explicit embedded editor URLs without requiring hash params', () => {
    setUrl('/visualization/thingsvis-editor?embedded=true');

    expect(isEmbeddedEditorUrl()).toBe(true);
  });
});
