/**
 * Reconnection Policy Schema
 * 
 * Defines WebSocket reconnection strategy configuration.
 * Supports exponential backoff with configurable limits.
 * 
 * @feature 009-datasource-form-config
 */

import { z } from 'zod';

// ============================================================================
// Reconnection Policy Schema
// ============================================================================

/**
 * Reconnection strategy configuration
 * Supports exponential backoff with configurable limits
 */
export const ReconnectPolicySchema = z.object({
  /** Whether automatic reconnection is enabled */
  enabled: z.boolean().default(true),
  
  /** Maximum number of reconnection attempts (0 = infinite) */
  maxAttempts: z.number().int().min(0).max(100).default(5),
  
  /** Initial delay before first reconnection attempt (seconds) */
  initialInterval: z.number().min(0.1).max(60).default(1),
  
  /** Whether to use exponential backoff (delay doubles each attempt) */
  useExponentialBackoff: z.boolean().default(true),
  
  /** Maximum delay between reconnection attempts (seconds) */
  maxInterval: z.number().min(1).max(300).default(60),
});

// ============================================================================
// Type Exports
// ============================================================================

export type ReconnectPolicy = z.infer<typeof ReconnectPolicySchema>;

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_RECONNECT_POLICY: ReconnectPolicy = {
  enabled: true,
  maxAttempts: 5,
  initialInterval: 1,
  useExponentialBackoff: true,
  maxInterval: 60,
};
