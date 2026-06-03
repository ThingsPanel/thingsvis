function resolveApiBaseFromLocation(sourceHref: string): string | null {
  try {
    const url = new URL(sourceHref);
    const fromSearch =
      url.searchParams.get('thingsvisApiBaseUrl') ||
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
        hashParams.get('thingsvisApiBaseUrl') ||
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

    try {
      const referrer = new URL(document.referrer);
      const isEmbedded = typeof window.parent !== 'undefined' && window.parent !== window;
      if (isEmbedded && referrer.origin) {
        return `${referrer.origin}/thingsvis-api`;
      }
    } catch {
      // ignore invalid referrer
    }
  }

  return `${window.location.origin}/api/v1`;
}
