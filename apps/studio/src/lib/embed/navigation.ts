export interface BuildHashRouteOptions {
  preserveCurrentParams?: boolean;
  currentHash?: string;
  params?: Record<string, string | null | undefined>;
}

export function getHashQueryParams(currentHash?: string): URLSearchParams {
  const hash = currentHash ?? (typeof window !== 'undefined' ? window.location.hash || '' : '');
  const queryIndex = hash.indexOf('?');
  return queryIndex >= 0 ? new URLSearchParams(hash.slice(queryIndex + 1)) : new URLSearchParams();
}

export function buildHashRoute(path: string, options: BuildHashRouteOptions = {}): string {
  const params = options.preserveCurrentParams
    ? getHashQueryParams(options.currentHash)
    : new URLSearchParams();

  Object.entries(options.params ?? {}).forEach(([key, value]) => {
    if (value == null || value === '') {
      params.delete(key);
      return;
    }
    params.set(key, value);
  });

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
