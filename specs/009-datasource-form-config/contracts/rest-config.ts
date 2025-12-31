/**
 * REST Configuration Contracts
 * 
 * This file defines the TypeScript interfaces and Zod schemas for REST data source configuration.
 * These contracts extend the existing RESTConfigSchema from @thingsvis/schema.
 * 
 * @feature 009-datasource-form-config
 * @package @thingsvis/schema
 */

import { z } from 'zod';

// ============================================================================
// Authentication Configuration
// ============================================================================

/**
 * No authentication required
 */
export const AuthNoneSchema = z.object({
  type: z.literal('none'),
});

/**
 * Bearer Token authentication
 * Adds header: Authorization: Bearer <token>
 */
export const AuthBearerSchema = z.object({
  type: z.literal('bearer'),
  token: z.string().min(1, 'Token is required'),
});

/**
 * Basic authentication (username/password)
 * Adds header: Authorization: Basic <base64(username:password)>
 */
export const AuthBasicSchema = z.object({
  type: z.literal('basic'),
  username: z.string().min(1, 'Username is required'),
  password: z.string(), // Can be empty
});

/**
 * API Key authentication
 * Can be placed in header or query parameter
 */
export const AuthApiKeySchema = z.object({
  type: z.literal('apiKey'),
  key: z.string().min(1, 'API Key name is required'),
  value: z.string().min(1, 'API Key value is required'),
  location: z.enum(['header', 'query']).default('header'),
});

/**
 * Discriminated union for all authentication types
 */
export const AuthConfigSchema = z.discriminatedUnion('type', [
  AuthNoneSchema,
  AuthBearerSchema,
  AuthBasicSchema,
  AuthApiKeySchema,
]);

// ============================================================================
// Extended REST Configuration
// ============================================================================

/**
 * Extended REST configuration with authentication, body, and timeout support
 */
export const RESTConfigSchema = z.object({
  // Existing fields (backward compatible)
  url: z.string().url('Invalid URL format'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
  headers: z.record(z.string()).optional().default({}),
  params: z.record(z.any()).optional().default({}),
  pollingInterval: z.number().min(0).optional().default(0),
  
  // New fields (all optional with defaults)
  body: z.string().optional(), // JSON string, validated separately
  timeout: z.number().min(1).max(300).optional().default(30), // seconds
  auth: AuthConfigSchema.optional().default({ type: 'none' }),
});

// ============================================================================
// Type Exports
// ============================================================================

export type AuthNone = z.infer<typeof AuthNoneSchema>;
export type AuthBearer = z.infer<typeof AuthBearerSchema>;
export type AuthBasic = z.infer<typeof AuthBasicSchema>;
export type AuthApiKey = z.infer<typeof AuthApiKeySchema>;
export type AuthConfig = z.infer<typeof AuthConfigSchema>;
export type RESTConfig = z.infer<typeof RESTConfigSchema>;

// ============================================================================
// Utility Functions
// ============================================================================

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
    case 'basic':
      const credentials = btoa(`${auth.username}:${auth.password}`);
      return { 'Authorization': `Basic ${credentials}` };
    case 'apiKey':
      return auth.location === 'header' ? { [auth.key]: auth.value } : {};
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

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_REST_CONFIG: RESTConfig = {
  url: '',
  method: 'GET',
  headers: {},
  params: {},
  pollingInterval: 0,
  timeout: 30,
  auth: { type: 'none' },
};

export const DEFAULT_AUTH_CONFIG: AuthConfig = { type: 'none' };
