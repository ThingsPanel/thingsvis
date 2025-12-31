/**
 * WebSocket Utilities for Data Sources
 * 
 * Provides helper functions for WebSocket reconnection logic,
 * connection state management, and heartbeat configuration.
 * 
 * @feature 009-datasource-form-config
 * @package @thingsvis/kernel
 */

import { ReconnectPolicy, WSConfig, DEFAULT_RECONNECT_POLICY } from '@thingsvis/schema';

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
  
  // Fallback to deprecated field for backward compatibility
  return {
    ...DEFAULT_RECONNECT_POLICY,
    maxAttempts: config.reconnectAttempts ?? 5,
  };
}

/**
 * Create initial connection status
 */
export function createInitialStatus(): WSConnectionStatus {
  return {
    state: 'idle',
    reconnectAttempt: undefined,
    maxAttempts: undefined,
    lastConnectedAt: undefined,
    error: undefined,
  };
}

/**
 * Create connection status for reconnecting state
 * @param attempt - Current attempt number (1-based for display)
 * @param maxAttempts - Maximum attempts configured
 */
export function createReconnectingStatus(attempt: number, maxAttempts: number): WSConnectionStatus {
  return {
    state: 'reconnecting',
    reconnectAttempt: attempt,
    maxAttempts: maxAttempts === 0 ? undefined : maxAttempts,
    error: undefined,
  };
}

/**
 * Create connection status for connected state
 */
export function createConnectedStatus(): WSConnectionStatus {
  return {
    state: 'connected',
    reconnectAttempt: undefined,
    lastConnectedAt: Date.now(),
    error: undefined,
  };
}

/**
 * Create connection status for failed state
 * @param error - Error message
 */
export function createFailedStatus(error: string): WSConnectionStatus {
  return {
    state: 'failed',
    error,
  };
}
