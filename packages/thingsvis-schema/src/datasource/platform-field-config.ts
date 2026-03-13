import { z } from 'zod';

/**
 * Platform Field Schema
 * Represents a field provided by the host platform (e.g., the host IoT platform)
 */
export const PlatformFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['number', 'string', 'boolean', 'json']),
  dataType: z.enum(['attribute', 'telemetry', 'command', 'event']),
  unit: z.string().optional(),
  description: z.string().optional(),
});

/**
 * Platform Field Config Schema
 * Configuration for PLATFORM_FIELD data source type.
 * The `source` string identifies the originating platform via its plugin driver (e.g., 'plugin-identifier').
 */
export const PlatformFieldConfigSchema = z.object({
  source: z.string().min(1),
  // Field mappings: { componentProperty: platformFieldId }
  fieldMappings: z.record(z.string()),
  // Optional explicit field request list for host-side lazy hydration.
  requestedFields: z.array(z.string()).optional(),
  // Device context variable (injected at runtime)
  deviceContext: z.string().optional(), // e.g., '{{ctx.deviceId}}'
  // 绑定到的特定设备 ID (为支持大屏多设备看板扩展)
  deviceId: z.string().optional(),
  // Ring buffer capacity. 0 = disabled (keep only latest single value).
  // When > 0, adapter exposes '{fieldId}__history' as a rolling time-series array.
  bufferSize: z.number().int().min(0).max(1000).default(0),
});

// Type exports
export type PlatformField = z.infer<typeof PlatformFieldSchema>;
export type PlatformFieldConfig = z.infer<typeof PlatformFieldConfigSchema>;

// Default values
export const DEFAULT_PLATFORM_FIELD_CONFIG: PlatformFieldConfig = {
  source: 'platform',
  fieldMappings: {},
  requestedFields: [],
  bufferSize: 0,
};
