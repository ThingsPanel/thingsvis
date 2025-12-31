/**
 * Authentication Utilities for REST Data Sources
 * 
 * Provides helper functions to generate HTTP headers and query parameters
 * from authentication configuration.
 * 
 * @feature 009-datasource-form-config
 * @package @thingsvis/kernel
 */

import { AuthConfig } from '@thingsvis/schema';

/**
 * Generate HTTP headers from AuthConfig
 * @param auth - Authentication configuration
 * @returns Record of header key-value pairs
 */
export function generateAuthHeaders(auth: AuthConfig): Record<string, string> {
  switch (auth.type) {
    case 'none':
      return {};
    case 'bearer':
      return { 'Authorization': `Bearer ${auth.token}` };
    case 'basic': {
      const credentials = btoa(`${auth.username}:${auth.password}`);
      return { 'Authorization': `Basic ${credentials}` };
    }
    case 'apiKey':
      return auth.location === 'header' ? { [auth.key]: auth.value } : {};
    default:
      return {};
  }
}

/**
 * Generate query parameters from AuthConfig (for API Key in query)
 * @param auth - Authentication configuration
 * @returns Record of query parameter key-value pairs
 */
export function generateAuthParams(auth: AuthConfig): Record<string, string> {
  if (auth.type === 'apiKey' && auth.location === 'query') {
    return { [auth.key]: auth.value };
  }
  return {};
}

/**
 * Validate JSON string
 * @param jsonString - String to validate
 * @returns { valid: true } or { valid: false, error: string }
 */
export function validateJsonBody(jsonString: string): { valid: boolean; error?: string } {
  if (!jsonString || jsonString.trim() === '') {
    return { valid: true }; // Empty is valid (no body)
  }
  try {
    JSON.parse(jsonString);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

/**
 * Append authentication query parameters to URL
 * @param url - Original URL
 * @param params - Query parameters to append
 * @returns URL with appended parameters
 */
export function appendAuthParamsToUrl(url: string, params: Record<string, string>): string {
  if (Object.keys(params).length === 0) {
    return url;
  }
  
  const urlObj = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    urlObj.searchParams.append(key, value);
  }
  return urlObj.toString();
}
