import { z } from 'zod';

// Re-export new configuration schemas
export * from './auth-config';
export * from './reconnect-config';
export * from './heartbeat-config';

// Import for use in extended schemas
import { AuthConfigSchema, DEFAULT_AUTH_CONFIG } from './auth-config';
import { ReconnectPolicySchema, DEFAULT_RECONNECT_POLICY } from './reconnect-config';
import { HeartbeatConfigSchema, DEFAULT_HEARTBEAT_CONFIG } from './heartbeat-config';

export const DataSourceTypeSchema = z.enum(['REST', 'WS', 'MQTT', 'STATIC']);

/**
 * Configuration for different data source types
 */
export const RESTConfigSchema = z.object({
  // Existing fields (backward compatible)
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
  headers: z.record(z.string()).optional().default({}),
  params: z.record(z.any()).optional().default({}),
  pollingInterval: z.number().min(0).optional().default(0), // seconds, 0 means no polling
  
  // New fields (all optional with defaults for backward compatibility)
  body: z.string().optional(), // JSON string for POST/PUT requests
  timeout: z.number().min(1).max(300).optional().default(30), // seconds
  auth: AuthConfigSchema.optional().default({ type: 'none' }),
});

export const WSConfigSchema = z.object({
  // Existing fields (backward compatible)
  url: z.string().url(),
  protocols: z.array(z.string()).optional().default([]),
  /** @deprecated Use reconnect.maxAttempts instead */
  reconnectAttempts: z.number().optional().default(5),
  
  // New fields (all optional with defaults for backward compatibility)
  reconnect: ReconnectPolicySchema.optional(),
  heartbeat: HeartbeatConfigSchema.optional(),
  initMessages: z.array(z.string()).optional().default([]),
});

export const MQTTConfigSchema = z.object({
  broker: z.string().url(),
  topic: z.string(),
  clientId: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

export const StaticConfigSchema = z.object({
  value: z.any(),
});

/**
 * Main DataSource Entity Schema
 */
export const DataSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: DataSourceTypeSchema,
  config: z.union([
    RESTConfigSchema,
    WSConfigSchema,
    MQTTConfigSchema,
    StaticConfigSchema,
  ]),
  transformation: z.string().optional(),
  options: z.object({
    enabled: z.boolean().default(true),
    cacheTime: z.number().optional(),
  }).optional(),
});

/**
 * Data Binding Schema for Node Props
 */
export const DataBindingSchema = z.object({
  targetProp: z.string(),
  expression: z.string().regex(/^\{\{.*\}\}$/, "Expression must be wrapped in {{ }}"),
});

export type DataSource = z.infer<typeof DataSourceSchema>;
export type DataBinding = z.infer<typeof DataBindingSchema>;
export type DataSourceType = z.infer<typeof DataSourceTypeSchema>;
export type RESTConfig = z.infer<typeof RESTConfigSchema>;
export type WSConfig = z.infer<typeof WSConfigSchema>;
export type MQTTConfig = z.infer<typeof MQTTConfigSchema>;
export type StaticConfig = z.infer<typeof StaticConfigSchema>;
