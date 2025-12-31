import { DataSource, RESTConfigSchema, RESTConfig, DEFAULT_AUTH_CONFIG } from '@thingsvis/schema';
import { BaseAdapter } from './BaseAdapter';
import { generateAuthHeaders, generateAuthParams, appendAuthParamsToUrl } from './auth-utils';

/**
 * RESTAdapter: Handles standard REST API data fetching with polling support.
 * 
 * Enhanced with:
 * - Authentication (Bearer, Basic, API Key)
 * - Custom request body for POST/PUT
 * - Request timeout using AbortController
 */
export class RESTAdapter extends BaseAdapter {
  private timer?: ReturnType<typeof setInterval>;
  private abortController?: AbortController;

  constructor() {
    super('REST');
  }

  public async connect(config: DataSource): Promise<void> {
    this.config = config;
    const restConfig = RESTConfigSchema.parse(config.config);

    await this.fetchData(restConfig);

    if (restConfig.pollingInterval && restConfig.pollingInterval > 0) {
      this.timer = setInterval(() => {
        this.fetchData(restConfig);
      }, restConfig.pollingInterval);
    }
  }

  /**
   * Fetch data with authentication, body, and timeout support
   */
  private async fetchData(config: RESTConfig): Promise<void> {
    try {
      // Cancel any pending request
      this.abortController?.abort();
      this.abortController = new AbortController();

      // Build URL with auth params if needed
      const auth = config.auth ?? DEFAULT_AUTH_CONFIG;
      const authParams = generateAuthParams(auth);
      const url = appendAuthParamsToUrl(config.url, authParams);

      // Build headers with auth and custom headers
      const authHeaders = generateAuthHeaders(auth);
      const headers: Record<string, string> = {
        ...config.headers,
        ...authHeaders,
      };

      // Add Content-Type for methods with body
      if (config.method !== 'GET' && config.method !== 'DELETE') {
        headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
      }

      // Determine request body
      let body: string | undefined;
      if (config.method !== 'GET') {
        // Prefer explicit body, fallback to params for backward compatibility
        body = config.body ?? (config.params && Object.keys(config.params).length > 0 
          ? JSON.stringify(config.params) 
          : undefined);
      }

      // Execute fetch with timeout
      const response = await this.fetchWithTimeout(url, {
        method: config.method,
        headers,
        body,
        signal: this.abortController.signal,
      }, (config.timeout ?? 30) * 1000);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawData = await response.json();
      this.emitData(rawData);
    } catch (e) {
      // Don't emit error if request was aborted intentionally
      if (e instanceof Error && e.name === 'AbortError') {
        return;
      }
      this.emitError(e);
    }
  }

  /**
   * Fetch with timeout using AbortController
   * @param url - Request URL
   * @param options - Fetch options
   * @param timeoutMs - Timeout in milliseconds
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number
  ): Promise<Response> {
    const timeoutId = setTimeout(() => {
      this.abortController?.abort();
    }, timeoutMs);

    try {
      const response = await fetch(url, options);
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs / 1000}s`);
      }
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    // Cancel pending request
    this.abortController?.abort();
    this.abortController = undefined;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    this.config = undefined;
  }
}

