/**
 * Authentication Configuration Schema
 * 
 * Defines authentication types for REST API data sources.
 * Supports: None, Bearer Token, Basic Auth, API Key
 * 
 * @feature 009-datasource-form-config
 */

import { z } from 'zod';

// ============================================================================
// Individual Authentication Type Schemas
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

// ============================================================================
// Combined Authentication Schema (Discriminated Union)
// ============================================================================

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
// Type Exports
// ============================================================================

export type AuthNone = z.infer<typeof AuthNoneSchema>;
export type AuthBearer = z.infer<typeof AuthBearerSchema>;
export type AuthBasic = z.infer<typeof AuthBasicSchema>;
export type AuthApiKey = z.infer<typeof AuthApiKeySchema>;
export type AuthConfig = z.infer<typeof AuthConfigSchema>;

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_AUTH_CONFIG: AuthConfig = { type: 'none' };
