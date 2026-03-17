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

  getAccessToken() {
    return this.getToken();
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const token = this.getToken();

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
  get<T>(path: string) {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>('POST', path, body);
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>('PUT', path, body);
  }

  delete<T>(path: string) {
    return this.request<T>('DELETE', path);
  }

  // File upload
  async upload(path: string, file: File): Promise<ApiResponse<{ url: string }>> {
    const url = `${this.baseUrl}${path}`;
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
