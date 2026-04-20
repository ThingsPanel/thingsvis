import { DataSource, RESTConfigSchema, RESTConfig, DEFAULT_AUTH_CONFIG } from '@thingsvis/schema';
import { BaseAdapter, type WriteResult } from './BaseAdapter';
import { generateAuthHeaders, generateAuthParams, appendAuthParamsToUrl } from './auth-utils';
import { ExpressionEvaluator } from '@thingsvis/utils';

/**
 * Resolve {{ var.xxx }} / $var.xxx expressions inside an arbitrary string
 * using the current variable snapshot.
 */
function resolveVarExpressions(template: string, variableValues: Record<string, unknown>): string {
  if (!template) return template;

  let resolved = template;
  // Handle {{ var.xxx }} template syntax
  if (resolved.includes('{{')) {
    resolved = ExpressionEvaluator.evaluate(resolved, { var: variableValues });
    // ExpressionEvaluator may return non-string for full-match expressions; ensure string
    if (typeof resolved !== 'string') resolved = String(resolved ?? '');
  }
  return resolved;
}

function resolveConfigValue(value: unknown, variableValues: Record<string, unknown>): unknown {
  if (typeof value === 'string') {
    return resolveVarExpressions(value, variableValues);
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveConfigValue(item, variableValues));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        resolveConfigValue(nestedValue, variableValues),
      ]),
    );
  }
  return value;
}

function toQueryValues(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => toQueryValues(item));
  }
  if (typeof value === 'object') {
    return [JSON.stringify(value)];
  }
  return [String(value)];
}

function getUrlBase(): string {
  if (typeof globalThis.location?.origin === 'string' && globalThis.location.origin) {
    return globalThis.location.origin;
  }
  return 'http://localhost';
}

function buildRequestUrl(
  urlTemplate: string,
  paramsTemplate: Record<string, unknown> | undefined,
  variableValues: Record<string, unknown>,
  includeParams: boolean,
): string {
  const resolvedUrl = resolveVarExpressions(urlTemplate, variableValues);
  const url = new URL(resolvedUrl, getUrlBase());

  if (includeParams && paramsTemplate) {
    const resolvedParams = resolveConfigValue(paramsTemplate, variableValues) as Record<
      string,
      unknown
    >;
    for (const [key, value] of Object.entries(resolvedParams)) {
      for (const item of toQueryValues(value)) {
        url.searchParams.append(key, item);
      }
    }
  }

  return url.toString();
}

/**
 * RESTAdapter: Handles standard REST API data fetching with polling support.
 *
 * Enhanced with:
 * - Authentication (Bearer, Basic, API Key)
 * - Custom request body for POST/PUT
 * - Request timeout using AbortController
 * - Variable expression resolution: {{ var.xxx }} in URL/headers/body (TASK-23)
 */
export class RESTAdapter extends BaseAdapter {
  private timer?: ReturnType<typeof setInterval>;
  private abortController?: AbortController;
  /** Parsed REST config template (URLs may contain {{ var.xxx }} expressions) */
  private restConfig?: RESTConfig;
  /** Latest variable snapshot — updated by DataSourceManager on variableValues change */
  private variableValues: Record<string, unknown> = {};

  constructor() {
    super('REST');
  }

  public async connect(config: DataSource): Promise<void> {
    this.config = config;
    this.restConfig = RESTConfigSchema.parse(config.config);

    await this.fetchData(this.restConfig);

    if (this.restConfig.pollingInterval && this.restConfig.pollingInterval > 0) {
      this.timer = setInterval(() => {
        if (this.restConfig) this.fetchData(this.restConfig);
      }, this.restConfig.pollingInterval * 1000);
    }
  }

  /**
   * Prepare the adapter with config but skip initial fetch and polling.
   * Used for 'manual' mode data sources (control/write endpoints).
   */
  public override async prepare(config: DataSource): Promise<void> {
    this.config = config;
    this.restConfig = RESTConfigSchema.parse(config.config);
  }

  /**
   * Trigger an on-demand data re-fetch using the current config.
   * Called after a successful write() to refresh displayed data.
   */
  public override async refresh(): Promise<void> {
    if (this.restConfig) {
      await this.fetchData(this.restConfig);
    }
  }

  /**
   * Called by DataSourceManager when dashboard variables change.
   * Updates the variable snapshot and immediately re-fetches.
   */
  public override async refreshWithVariables(
    variableValues: Record<string, unknown>,
  ): Promise<void> {
    this.variableValues = variableValues;
    if (this.restConfig) {
      await this.fetchData(this.restConfig);
    }
  }

  /**
   * Write a value to the REST endpoint.
   * Sends a POST request to the configured URL with the payload as the JSON body.
   * Auth headers from the adapter config are included automatically.
   *
   * The `payload` is sent directly as the request body.
   * Objects/arrays are JSON-stringified; strings are sent as-is (assumed to
   * already be valid JSON); primitives are JSON-stringified as bare values.
   */
  public override async write(payload: unknown): Promise<WriteResult> {
    if (!this.restConfig) {
      return { success: false, error: 'RESTAdapter is not connected' };
    }
    try {
      const config = this.restConfig;
      const url = buildRequestUrl(config.url, config.params, this.variableValues, true);
      const auth = config.auth ?? DEFAULT_AUTH_CONFIG;
      const authParams = generateAuthParams(auth);
      const finalUrl = appendAuthParamsToUrl(url, authParams);

      // Resolve variable expressions in custom headers (same as fetchData)
      const resolvedHeaders: Record<string, string> = {};
      if (config.headers) {
        for (const [k, v] of Object.entries(config.headers)) {
          resolvedHeaders[k] = String(resolveConfigValue(v, this.variableValues) ?? '');
        }
      }

      const authHeaders = generateAuthHeaders(auth);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...resolvedHeaders,
        ...authHeaders,
      };

      // Send payload directly — no wrapping in { value: ... }
      // Strings are assumed to already be JSON; objects are stringified.
      const body = typeof payload === 'string' ? payload : JSON.stringify(payload);

      const response = await fetch(finalUrl, { method: 'POST', headers, body });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

      let echo: unknown;
      try {
        echo = await response.json();
      } catch {
        echo = undefined;
      }
      return { success: true, echo };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * Fetch data with authentication, body, and timeout support.
   * Resolves {{ var.xxx }} expressions in URL/headers/body before fetching.
   */
  private async fetchData(config: RESTConfig): Promise<void> {
    try {
      // Cancel any pending request
      this.abortController?.abort();
      this.abortController = new AbortController();

      const shouldAppendParamsToUrl = config.method === 'GET' || config.method === 'DELETE';
      const rawUrl = buildRequestUrl(
        config.url,
        config.params,
        this.variableValues,
        shouldAppendParamsToUrl,
      );

      // Build URL with auth params if needed
      const auth = config.auth ?? DEFAULT_AUTH_CONFIG;
      const authParams = generateAuthParams(auth);
      const url = appendAuthParamsToUrl(rawUrl, authParams);

      // Resolve variable expressions in headers
      const resolvedHeaders: Record<string, string> = {};
      if (config.headers) {
        for (const [k, v] of Object.entries(config.headers)) {
          resolvedHeaders[k] = String(resolveConfigValue(v, this.variableValues) ?? '');
        }
      }

      // Build headers with auth and custom headers
      const authHeaders = generateAuthHeaders(auth);
      const headers: Record<string, string> = {
        ...resolvedHeaders,
        ...authHeaders,
      };

      // Add Content-Type for methods with body
      if (config.method !== 'GET' && config.method !== 'DELETE') {
        headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
      }

      // Determine request body (resolve variable expressions in body too)
      let body: string | undefined;
      if (config.method !== 'GET' && config.method !== 'DELETE') {
        if (config.body) {
          body = resolveVarExpressions(config.body, this.variableValues);
        } else if (config.params && Object.keys(config.params).length > 0) {
          body = JSON.stringify(resolveConfigValue(config.params, this.variableValues));
        }
      }

      // Execute fetch with timeout
      const response = await this.fetchWithTimeout(
        url,
        {
          method: config.method,
          headers,
          body,
          signal: this.abortController.signal,
        },
        (config.timeout ?? 30) * 1000,
      );

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
    timeoutMs: number,
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
    this.restConfig = undefined;
    this.variableValues = {};
  }
}
