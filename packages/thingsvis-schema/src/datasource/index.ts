import { z } from 'zod';

export const DataSourceTypeSchema = z.enum(['REST', 'WS', 'MQTT', 'STATIC']);

/**
 * Configuration for different data source types
 */
export const RESTConfigSchema = z.object({
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
  headers: z.record(z.string()).optional(),
  params: z.record(z.any()).optional(),
  pollingInterval: z.number().min(0).optional(), // 0 means no polling
});

export const WSConfigSchema = z.object({
  url: z.string().url(),
  protocols: z.array(z.string()).optional(),
  reconnectAttempts: z.number().default(5),
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
