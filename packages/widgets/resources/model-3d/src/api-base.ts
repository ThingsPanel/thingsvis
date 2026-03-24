function resolveApiBaseFromLocation(sourceHref: string): string | null {
  try {
    const url = new URL(sourceHref);
    const fromSearch =
      url.searchParams.get('apiBaseUrl') ||
      url.searchParams.get('apiUrl') ||
      url.searchParams.get('backendUrl');
    if (fromSearch) {
      return fromSearch;
    }

    const hash = url.hash || '';
    const queryIndex = hash.indexOf('?');
    if (queryIndex >= 0) {
      const hashParams = new URLSearchParams(hash.slice(queryIndex + 1));
      const fromHash =
        hashParams.get('apiBaseUrl') ||
        hashParams.get('apiUrl') ||
        hashParams.get('backendUrl');
      if (fromHash) {
        return fromHash;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function resolveWidgetApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return '/api/v1';
  }

  const fromWindow = resolveApiBaseFromLocation(window.location.href);
  if (fromWindow) {
    return fromWindow;
  }

  if (typeof document !== 'undefined' && document.referrer) {
    const fromReferrer = resolveApiBaseFromLocation(document.referrer);
    if (fromReferrer) {
      return fromReferrer;
    }
  }

  return `${window.location.origin}/api/v1`;
}
