/**
 * API Client for ThingsVis Server
 * 
 * Handles all HTTP requests to the backend with automatic token management.
 */

const DEFAULT_API_BASE_URL = 'http://localhost:3001/api/v1';
const TOKEN_KEY = 'thingsvis_token'; // Must match AuthContext

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
    this.getToken = config.getToken || (() => localStorage.getItem(TOKEN_KEY));
    this.onUnauthorized = config.onUnauthorized || (() => {});
  }

  configure(config: Partial<ApiClientConfig>) {
    if (config.baseUrl) this.baseUrl = config.baseUrl;
    if (config.getToken) this.getToken = config.getToken;
    if (config.onUnauthorized) this.onUnauthorized = config.onUnauthorized;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const token = this.getToken();

    console.log('[API Client] Request:', {
      method,
      path,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null,
    });

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
        console.error('[API Client] 401 Unauthorized:', {
          url,
          method,
          hasToken: !!token,
          response: data,
        });
        
        // Only call onUnauthorized if we actually had a token
        // This prevents clearing auth on initial requests
        if (token) {
          console.warn('[API Client] Calling onUnauthorized handler');
          this.onUnauthorized();
        }
        
        return { error: data.error || 'Unauthorized' };
      }

      if (!response.ok) {
        return { error: data.error || 'Request failed', details: data.details };
      }

      // If response already has a data field, return as-is
      // Otherwise wrap the response in a data field for consistency
      if ('data' in data) {
        return data;
      }
      return { data };
    } catch (error) {
      console.error('API request failed:', error);
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
    } catch (error) {
      console.error('Upload failed:', error);
      return { error: 'Network error' };
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

export default apiClient;
