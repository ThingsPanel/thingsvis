export function getHashUrlParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  const hash = window.location.hash || '';
  const queryIndex = hash.indexOf('?');
  if (queryIndex < 0) return new URLSearchParams();
  return new URLSearchParams(hash.slice(queryIndex + 1));
}

export function getSearchUrlParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search || '');
}

export function getMergedEditorUrlParams(): URLSearchParams {
  const merged = new URLSearchParams(getSearchUrlParams());
  getHashUrlParams().forEach((value, key) => {
    merged.set(key, value);
  });
  return merged;
}

export function isWindowEmbedded(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function isEmbeddedEditorUrl(): boolean {
  const params = getMergedEditorUrlParams();
  const mode = (params.get('mode') || '').trim().toLowerCase();
  const embedded = (params.get('embedded') || '').trim().toLowerCase();
  return (
    isWindowEmbedded() ||
    mode === 'embedded' ||
    embedded === '1' ||
    embedded === 'true' ||
    embedded === 'yes'
  );
}

export function getDashboardIdFromEditorUrl(): string | null {
  const hashParams = getHashUrlParams();
  const searchParams = getSearchUrlParams();

  return (
    hashParams.get('dashboardId') ||
    hashParams.get('projectId') ||
    hashParams.get('id') ||
    searchParams.get('dashboardId') ||
    searchParams.get('id')
  );
}

export function getBackendProjectIdFromEditorUrl(): string | null {
  const hashParams = getHashUrlParams();
  const searchParams = getSearchUrlParams();

  return (
    hashParams.get('backendProjectId') ||
    hashParams.get('workspaceProjectId') ||
    searchParams.get('projectId') ||
    searchParams.get('backendProjectId') ||
    searchParams.get('workspaceProjectId')
  );
}
