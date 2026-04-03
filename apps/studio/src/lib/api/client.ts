/**
 * API Client for ThingsVis Server
 *
 * Handles all HTTP requests to the backend with automatic token management.
 */

/**
 * Resolve API base URL from URL parameters (embed mode) or defaults.
 * The host application passes apiBaseUrl via URL params so that the
 * embedded iframe can route API requests through the correct proxy
 * path BEFORE any postMessage communication happens.
 */
function resolveDefaultApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1`;
  }

  // Priority: URL params > hash params > default
  try {
    const url = new URL(window.location.href);

    // Check search params first
    const fromSearch =
      url.searchParams.get('apiBaseUrl') ||
      url.searchParams.get('apiUrl') ||
      url.searchParams.get('backendUrl');
    if (fromSearch) return fromSearch;

    // Check hash params (e.g. #/embed?apiBaseUrl=xxx)
    const hash = url.hash || '';
    const qIdx = hash.indexOf('?');
    if (qIdx >= 0) {
      const hashParams = new URLSearchParams(hash.slice(qIdx + 1));
      const fromHash =
        hashParams.get('apiBaseUrl') || hashParams.get('apiUrl') || hashParams.get('backendUrl');
      if (fromHash) return fromHash;
    }
  } catch {
    // URL parsing failed, fall through to default
  }

  return `${window.location.origin}/api/v1`;
}

const DEFAULT_API_BASE_URL = resolveDefaultApiBaseUrl();
const BROWSER_TOKEN_KEY = 'thingsvis_browser_token';

function toAbsoluteBaseUrl(baseUrl: string): string {
  if (/^https?:\/\//i.test(baseUrl)) return baseUrl;

  if (typeof window !== 'undefined') {
    return new URL(baseUrl, window.location.origin).toString();
  }

  return `http://localhost:8000${baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`}`;
}

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function extractUploadPath(source: string, baseUrl: string): string | null {
  const trimmed = source.trim();
  if (!trimmed) return null;

  const normalizeUploadPath = (pathname: string): string | null => {
    if (pathname.startsWith('/uploads/')) return pathname;
    if (pathname.startsWith('/api/v1/uploads/')) {
      return pathname.slice('/api/v1'.length);
    }
    return null;
  };

  if (trimmed.startsWith('uploads/')) {
    return `/${trimmed}`;
  }

  if (trimmed.startsWith('/')) {
    return normalizeUploadPath(trimmed);
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return null;
  }

  try {
    const base = new URL(toAbsoluteBaseUrl(baseUrl));
    const candidate = new URL(trimmed);
    if (candidate.origin !== base.origin) {
      return null;
    }

    return normalizeUploadPath(candidate.pathname);
  } catch {
    return null;
  }
}

function joinApiUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export interface ApiClientConfig {
  baseUrl?: string;
  getToken?: () => string | null;
  onUnauthorized?: () => void;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  details?: unknown;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiClient {
  private baseUrl: string;
  private getToken: () => string | null;
  private onUnauthorized: () => void;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || DEFAULT_API_BASE_URL;
    this.getToken = config.getToken || (() => localStorage.getItem(BROWSER_TOKEN_KEY));
    this.onUnauthorized = config.onUnauthorized || (() => {});
  }

  configure(config: Partial<ApiClientConfig>) {
    if (config.baseUrl) this.baseUrl = config.baseUrl;
    if (config.getToken) this.getToken = config.getToken;
    if (config.onUnauthorized) this.onUnauthorized = config.onUnauthorized;
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  getRequestUrl(path: string) {
    return joinApiUrl(this.baseUrl, path);
  }

  resolveAssetUrl(path: string) {
    if (!path) return path;
    const uploadPath = extractUploadPath(path, this.baseUrl);
    if (uploadPath) {
      return this.getRequestUrl(uploadPath);
    }

    if (/^https?:\/\//i.test(path)) return path;

    const absoluteBase = new URL(toAbsoluteBaseUrl(this.baseUrl));
    const baseOrigin = `${absoluteBase.origin}${trimTrailingSlash(absoluteBase.pathname) || ''}/`;
    return new URL(path, baseOrigin).toString();
  }

  getAccessToken() {
    return this.getToken();
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: RequestInit & { skipAuth?: boolean } = {},
  ): Promise<ApiResponse<T>> {
    const url = this.getRequestUrl(path);
    const inEmbedContext =
      typeof window !== 'undefined' && window.location.hash.includes('mode=embedded');
    const persistedBrowserToken =
      typeof window !== 'undefined' && !inEmbedContext
        ? localStorage.getItem(BROWSER_TOKEN_KEY)
        : null;
    const token = options.skipAuth ? null : this.getToken() || persistedBrowserToken;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        ...options,
      });

      const data = await response.json();

      if (response.status === 401) {
        if (token) {
          this.onUnauthorized();
        }
        return { error: data.error || 'Unauthorized' };
      }

      if (!response.ok) {
        return { error: data.error || 'Request failed', details: data.details };
      }

      if ('data' in data) {
        return data;
      }
      return { data };
    } catch {
      return { error: 'Network error' };
    }
  }

  // Generic methods
  get<T>(path: string, options?: RequestInit & { skipAuth?: boolean }) {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(path: string, body?: unknown, options?: RequestInit & { skipAuth?: boolean }) {
    return this.request<T>('POST', path, body, options);
  }

  put<T>(path: string, body?: unknown, options?: RequestInit & { skipAuth?: boolean }) {
    return this.request<T>('PUT', path, body, options);
  }

  delete<T>(path: string, options?: RequestInit & { skipAuth?: boolean }) {
    return this.request<T>('DELETE', path, undefined, options);
  }

  // File upload
  async upload(path: string, file: File): Promise<ApiResponse<{ url: string }>> {
    const url = this.getRequestUrl(path);
    const token = this.getToken();

    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (response.status === 401) {
        this.onUnauthorized();
        return { error: 'Invalid credentials' };
      }

      if (!response.ok) {
        return { error: data.error || 'Upload failed' };
      }

      return data;
    } catch {
      return { error: 'Network error' };
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

export default apiClient;
