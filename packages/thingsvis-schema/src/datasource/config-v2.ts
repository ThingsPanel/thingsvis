import { z } from 'zod';
import {
  DataSourceTypeSchema,
  DataSourceModeSchema,
  RESTConfigSchema,
  WSConfigSchema,
  MQTTConfigSchema,
  StaticConfigSchema,
  PlatformFieldConfigSchema,
} from './index';
import {
  FieldMappingConfigSchema,
  DEFAULT_FIELD_MAPPING_CONFIG,
  type FieldMappingConfig,
} from './field-mapping';

/**
 * Adapter connection status — reported by adapters at runtime.
 * Stored in the kernel store and surfaced in the editor UI.
 */
export const AdapterStatusSchema = z.enum([
  'idle', // never connected
  'loading', // connecting / fetching
  'connected', // active connection / successful fetch
  'error', // connection failed
  'disconnected', // cleanly closed
]);

export type AdapterStatus = z.infer<typeof AdapterStatusSchema>;

/**
 * v2 DataSource Schema — independent definition (avoids circular import with datasource/index.ts)
 * All v1 fields are replicated here, plus the v2 additions.
 *
 * Fully backward-compatible: all new fields are optional with safe defaults.
 */
export const DataSourceV2Schema = z.object({
  // ── v1 base fields (mirrored from DataSourceSchema in datasource/index.ts) ──
  id: z.string(),
  name: z.string(),
  type: DataSourceTypeSchema,
  config: z.union([
    RESTConfigSchema,
    WSConfigSchema,
    MQTTConfigSchema,
    StaticConfigSchema,
    PlatformFieldConfigSchema,
  ]),
  transformation: z.string().optional(),
  options: z
    .object({
      enabled: z.boolean().default(true),
      cacheTime: z.number().optional(),
    })
    .optional(),
  /**
   * Trigger mode: 'auto' (read on load) | 'manual' (write-only, triggered by user action).
   * Default 'auto' for backward compatibility.
   */
  mode: DataSourceModeSchema.optional(),

  // ── v2 extensions ─────────────────────────────────────────────────────────
  fieldMappings: FieldMappingConfigSchema.optional().default(DEFAULT_FIELD_MAPPING_CONFIG),
  /** REST: override URL for write operations (default: same as read URL) */
  writeEndpoint: z.string().url().optional(),
  /** WS/MQTT: the JSON field to use when writing (coerces scalar → `{writeField: value}`) */
  writeField: z.string().optional(),
  /** Human-readable display label shown in the source picker */
  label: z.string().optional(),
});

export type DataSourceV2 = z.infer<typeof DataSourceV2Schema>;

/**
 * Parse and validate a raw dashboard JSON object as DataSourceV2.
 * Falls back gracefully to v1 schema when v2 fields are absent.
 *
 * @throws ZodError when the object is structurally invalid even as v1.
 */
export function parseDataSourceConfig(raw: unknown): DataSourceV2 {
  return DataSourceV2Schema.parse(raw);
}

/**
 * Safe parse — returns success/error without throwing.
 */
export function safeParseDataSourceConfig(
  raw: unknown,
): { success: true; data: DataSourceV2 } | { success: false; error: string } {
  const result = DataSourceV2Schema.safeParse(raw);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error.message };
}

/**
 * Migrate a legacy PlatformFieldConfig `fieldMappings` map
 * (`{ componentProp: deviceFieldId }`) to the new FieldMappingConfig format.
 *
 * Legacy format (v1):
 *   { fieldMappings: { temperature: 'attr_001', humidity: 'attr_002' } }
 *
 * New format (v2 FieldMappingConfig):
 *   { rules: [{ from: '$.temperature', to: 'temperature' }, ...], merge: false }
 *
 * @param legacyMap  The `fieldMappings` record from a v1 PlatformFieldConfig
 * @returns          A FieldMappingConfig with one rule per legacy mapping
 */
export function migrateLegacyFieldMappings(legacyMap: Record<string, string>): FieldMappingConfig {
  const rules = Object.entries(legacyMap).map(([prop, fieldId]) => ({
    // Raw platform data is expected to be an object keyed by fieldId
    from: `$.${fieldId}`,
    to: prop,
    aggregate: 'last' as const,
  }));

  return FieldMappingConfigSchema.parse({ rules, merge: false });
}

/**
 * Upgrade a plain DataSource config object (v1) to DataSourceV2.
 * Handles the legacy `PlatformFieldConfig.fieldMappings` → v2 `FieldMappingConfig` migration.
 * Safe to call on already-upgraded configs (idempotent).
 */
export function upgradeDataSourceConfig(raw: unknown): DataSourceV2 {
  if (raw === null || typeof raw !== 'object') {
    throw new Error('[upgradeDataSourceConfig] Expected a config object');
  }

  const obj = raw as Record<string, unknown>;

  // Detect legacy PlatformFieldConfig style fieldMappings: Record<string, string>
  const existingFieldMappings = obj.fieldMappings;
  if (
    existingFieldMappings &&
    typeof existingFieldMappings === 'object' &&
    !Array.isArray(existingFieldMappings) &&
    !('rules' in existingFieldMappings) // not already v2
  ) {
    const legacyMap = existingFieldMappings as Record<string, string>;
    // Check values are strings (legacy format) vs objects (v2 rules)
    const isLegacy = Object.values(legacyMap).every((v) => typeof v === 'string');
    if (isLegacy) {
      obj.fieldMappings = migrateLegacyFieldMappings(legacyMap);
    }
  }

  return DataSourceV2Schema.parse(obj);
}
