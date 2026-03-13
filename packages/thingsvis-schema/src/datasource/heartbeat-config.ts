/**
 * Heartbeat Configuration Schema
 * 
 * Defines WebSocket heartbeat/keep-alive configuration.
 * Periodically sends messages to prevent connection timeout.
 * 
 * @feature 009-datasource-form-config
 */

import { z } from 'zod';

// ============================================================================
// Heartbeat Configuration Schema
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
// Type Exports
// ============================================================================

export type HeartbeatConfig = z.infer<typeof HeartbeatConfigSchema>;

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_HEARTBEAT_CONFIG: HeartbeatConfig = {
  enabled: false,
  interval: 30,
  message: 'ping',
};
