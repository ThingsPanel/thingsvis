import { z } from 'zod';

/**
 * Platform Field Schema
 * Represents a field provided by the host platform (e.g., ThingsPanel)
 */
export const PlatformFieldSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['number', 'string', 'boolean', 'json']),
    dataType: z.enum(['attribute', 'telemetry', 'command']),
    unit: z.string().optional(),
    description: z.string().optional(),
});

/**
 * Platform Field Config Schema
 * Configuration for PLATFORM_FIELD data source type
 */
export const PlatformFieldConfigSchema = z.object({
    source: z.literal('ThingsPanel'),
    // Field mappings: { componentProperty: platformFieldId }
    fieldMappings: z.record(z.string()),
    // Device context variable (injected at runtime)
    deviceContext: z.string().optional(), // e.g., '{{ctx.deviceId}}'
});

// Type exports
export type PlatformField = z.infer<typeof PlatformFieldSchema>;
export type PlatformFieldConfig = z.infer<typeof PlatformFieldConfigSchema>;

// Default values
export const DEFAULT_PLATFORM_FIELD_CONFIG: PlatformFieldConfig = {
    source: 'ThingsPanel',
    fieldMappings: {},
};
