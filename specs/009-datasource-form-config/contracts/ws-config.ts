/**
 * WebSocket Configuration Contracts
 * 
 * This file defines the TypeScript interfaces and Zod schemas for WebSocket data source configuration.
 * These contracts extend the existing WSConfigSchema from @thingsvis/schema.
 * 
 * @feature 009-datasource-form-config
 * @package @thingsvis/schema
 */

import { z } from 'zod';

// ============================================================================
// Reconnection Policy
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
// Heartbeat Configuration
// ============================================================================

/**
 * Heartbeat/keep-alive configuration
 * Periodically sends messages to prevent connection timeout
 */
export const HeartbeatConfigSchema = z.object({
  /** Whether heartbeat is enabled */
  enabled: z.boolean().default(false),
  
  /** Interval between heartbeat messages (seconds) */
  interval: z.number().min(5).max(300).default(30),
  
  /** Message content to send (can be plain text or JSON) */
  message: z.string().default('ping'),
});

// ============================================================================
// Extended WebSocket Configuration
// ============================================================================

/**
 * Extended WebSocket configuration with reconnection, heartbeat, and initial messages
 */
export const WSConfigSchema = z.object({
  // Existing fields (backward compatible)
  url: z.string().url('Invalid WebSocket URL'),
  protocols: z.array(z.string()).optional().default([]),
  
  /** @deprecated Use reconnect.maxAttempts instead */
  reconnectAttempts: z.number().optional().default(5),
  
  // New fields (all optional with defaults)
  reconnect: ReconnectPolicySchema.optional(),
  heartbeat: HeartbeatConfigSchema.optional(),
  
  /** Messages to send immediately after connection/reconnection */
  initMessages: z.array(z.string()).optional().default([]),
});

// ============================================================================
// Type Exports
// ============================================================================

export type ReconnectPolicy = z.infer<typeof ReconnectPolicySchema>;
export type HeartbeatConfig = z.infer<typeof HeartbeatConfigSchema>;
export type WSConfig = z.infer<typeof WSConfigSchema>;

// ============================================================================
// Connection State
// ============================================================================

/**
 * WebSocket connection states
 */
export type WSConnectionState = 
  | 'idle'         // Not connected, not attempting
  | 'connecting'   // Connection in progress
  | 'connected'    // Successfully connected
  | 'reconnecting' // Attempting to reconnect
  | 'failed';      // All reconnection attempts exhausted

/**
 * WebSocket connection status for UI display
 */
export interface WSConnectionStatus {
  state: WSConnectionState;
  /** Current reconnection attempt number (1-based) */
  reconnectAttempt?: number;
  /** Total max attempts configured */
  maxAttempts?: number;
  /** Timestamp of last successful connection */
  lastConnectedAt?: number;
  /** Error message if failed */
  error?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate reconnection delay using exponential backoff
 * @param attempt - Current attempt number (0-based)
 * @param policy - Reconnection policy configuration
 * @returns Delay in milliseconds
 */
export function calculateReconnectDelay(attempt: number, policy: ReconnectPolicy): number {
  const { initialInterval, useExponentialBackoff, maxInterval } = policy;
  
  let delaySec: number;
  if (useExponentialBackoff) {
    delaySec = initialInterval * Math.pow(2, attempt);
  } else {
    delaySec = initialInterval;
  }
  
  return Math.min(delaySec, maxInterval) * 1000; // Convert to ms
}

/**
 * Check if reconnection should be attempted
 * @param attempt - Current attempt number (0-based)
 * @param policy - Reconnection policy configuration
 * @returns true if another attempt should be made
 */
export function shouldReconnect(attempt: number, policy: ReconnectPolicy): boolean {
  if (!policy.enabled) return false;
  if (policy.maxAttempts === 0) return true; // Infinite
  return attempt < policy.maxAttempts;
}

/**
 * Get effective reconnect policy (with backward compatibility for deprecated field)
 * @param config - WebSocket configuration
 * @returns Resolved reconnect policy
 */
export function getEffectiveReconnectPolicy(config: WSConfig): ReconnectPolicy {
  if (config.reconnect) {
    return config.reconnect;
  }
  
  // Fallback to deprecated field
  return {
    enabled: true,
    maxAttempts: config.reconnectAttempts ?? 5,
    initialInterval: 1,
    useExponentialBackoff: true,
    maxInterval: 60,
  };
}

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

export const DEFAULT_HEARTBEAT_CONFIG: HeartbeatConfig = {
  enabled: false,
  interval: 30,
  message: 'ping',
};

export const DEFAULT_WS_CONFIG: WSConfig = {
  url: '',
  protocols: [],
  reconnectAttempts: 5, // deprecated but kept for compatibility
  reconnect: DEFAULT_RECONNECT_POLICY,
  heartbeat: DEFAULT_HEARTBEAT_CONFIG,
  initMessages: [],
};
