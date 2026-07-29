/**
 * Market Template Dashboard Export/Import Validators and Types
 *
 * These schemas define the contract for exporting/importing dashboard templates
 * for the ThingsPanel Market Solution Bundle system.
 *
 * Security guarantees:
 * - Export never includes real deviceIds, tenantIds, shareTokens, or userIds
 * - All device references are replaced with bindingKey placeholders
 * - Import validates deviceBindings[] against device template keys
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Inline CanvasConfig schema (duplicated from dashboard validator to avoid test path issues)
// ---------------------------------------------------------------------------
const LayoutModeSchema = z.enum(['fixed', 'infinite', 'reflow', 'grid']);
const CanvasThemeSchema = z.enum(['dawn', 'midnight', 'ocean', 'ember', 'aurora', 'frost']);
const PreviewScaleModeSchema = z.enum([
  'fit-min',
  'fit-width',
  'fit-height',
  'stretch',
  'original',
]);
const PreviewAlignYSchema = z.enum(['top', 'center']);

const CanvasBackgroundObjectSchema = z.object({
  color: z.string().optional(),
  image: z.string().optional(),
  size: z.string().optional(),
  repeat: z.string().optional(),
  attachment: z.string().optional(),
});

const CanvasBackgroundSchema = z.union([z.string(), CanvasBackgroundObjectSchema]);

const CanvasConfigSchema = z
  .object({
    mode: LayoutModeSchema.default('fixed'),
    width: z.number().int().positive().default(1920),
    height: z.number().int().positive().default(1080),
    background: CanvasBackgroundSchema.default('#1a1a2e'),
    theme: CanvasThemeSchema.default('dawn'),
    scaleMode: PreviewScaleModeSchema.optional(),
    previewAlignY: PreviewAlignYSchema.optional(),
    gridCols: z.number().int().min(1).max(48).optional(),
    gridRowHeight: z.number().int().positive().optional(),
    gridGap: z.number().int().nonnegative().optional(),
    padding: z.number().int().nonnegative().optional(),
    gridEnabled: z.boolean().optional(),
    gridSize: z.number().int().positive().optional(),
    fullWidthPreview: z.boolean().optional(),
    homeFlag: z.boolean().optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Security-sensitive field patterns that must be stripped during export
// ---------------------------------------------------------------------------
const SENSITIVE_FIELDS = [
  'deviceId',
  'tenantId',
  'userId',
  'shareToken',
  'password',
  'secret',
  'token',
  'apiKey',
  'api_key',
] as const;

// Pattern to match generated platform data source IDs (from hostDataSourcePolicy)
const GENERATED_PLATFORM_DS_ID_RE = /^__platform_.+__$/;
const GENERATED_HOST_DS_ID_RE = /^(?:__platform_.+__|thingspanel_.+)$/;
const TEMPLATE_DEVICE_ID = '__template__';

// ---------------------------------------------------------------------------
// deviceBinding structure per contract
// ---------------------------------------------------------------------------
export const DeviceBindingSchema = z.object({
  bindingKey: z
    .string()
    .min(1)
    .max(63)
    .regex(
      /^[a-z][a-z0-9-]*$/,
      'bindingKey must start with lowercase letter, alphanumeric with hyphens',
    ),
  deviceTemplateKey: z
    .string()
    .min(1)
    .max(63)
    .regex(
      /^[a-z][a-z0-9-]*$/,
      'deviceTemplateKey must start with lowercase letter, alphanumeric with hyphens',
    ),
  displayName: z.string().max(100).optional(),
  required: z.boolean().default(true),
  allowMany: z.boolean().default(false),
});

export type DeviceBinding = z.infer<typeof DeviceBindingSchema>;

/**
 * Pre-parse shape. `required` and `allowMany` carry zod defaults, so z.infer
 * (the *output* type) marks them present, while anything not yet parsed —
 * a bundle off the wire, a test fixture, the validators below — legitimately
 * omits them. Validators take this type; parsed values keep DeviceBinding.
 */
export type DeviceBindingInput = z.input<typeof DeviceBindingSchema>;

// ---------------------------------------------------------------------------
// fieldBinding structure per contract
// ---------------------------------------------------------------------------
export const FieldBindingSchema = z.object({
  bindingKey: z.string().min(1),
  kind: z.enum(['telemetry', 'attribute', 'command', 'event']),
  identifier: z.string().min(1),
  required: z.boolean().default(true),
});

export type FieldBinding = z.infer<typeof FieldBindingSchema>;

/** Pre-parse shape; `required` carries a zod default. See DeviceBindingInput. */
export type FieldBindingInput = z.input<typeof FieldBindingSchema>;

// ---------------------------------------------------------------------------
// DashboardTemplateSnapshot - the core export structure
// ---------------------------------------------------------------------------
export const DashboardTemplateSnapshotSchema = z.object({
  resourceKey: z
    .string()
    .min(1)
    .max(63)
    .regex(
      /^[a-z][a-z0-9-]*$/,
      'resourceKey must start with lowercase letter, alphanumeric with hyphens',
    ),
  version: z.string().min(1),
  name: z.string().min(1).max(100),
  schemaVersion: z.string().min(1),
  canvasConfig: CanvasConfigSchema,
  nodes: z.array(z.unknown()),
  dataSources: z.array(z.unknown()),
  variables: z.array(z.unknown()),
  deviceBindings: z.array(DeviceBindingSchema),
  fieldBindings: z.array(FieldBindingSchema).default([]),
});

export type DashboardTemplateSnapshot = z.infer<typeof DashboardTemplateSnapshotSchema>;

/**
 * Pre-parse shape. validateImportedSnapshot() exists precisely to inspect
 * *untrusted, unparsed* content, so it must not demand a fully-defaulted
 * snapshot as its input.
 */
export type DashboardTemplateSnapshotInput = z.input<typeof DashboardTemplateSnapshotSchema>;

// ---------------------------------------------------------------------------
// Export request validation
// ---------------------------------------------------------------------------
export const ExportDashboardQuerySchema = z.object({
  exportMode: z.enum(['market-template']).default('market-template'),
  deviceBindingHints: z
    .array(
      z.object({
        deviceId: z.string().optional(), // For hint only - maps to bindingKey
        bindingKey: z.string(),
        deviceTemplateKey: z.string(),
      }),
    )
    .optional(),
});

export type ExportDashboardQuery = z.infer<typeof ExportDashboardQuerySchema>;

// ---------------------------------------------------------------------------
// Import request validation
// ---------------------------------------------------------------------------
export const ImportDashboardBodySchema = z.object({
  snapshot: DashboardTemplateSnapshotSchema,
  localDeviceBindings: z
    .array(
      z.object({
        bindingKey: z.string(),
        deviceId: z.string().min(1, 'deviceId is required for import'),
      }),
    )
    .min(1, 'At least one device binding is required'),
  name: z.string().min(1).max(100).optional(), // Override snapshot name
  projectId: z.string().optional(),
});

export type ImportDashboardBody = z.infer<typeof ImportDashboardBodySchema>;

// ---------------------------------------------------------------------------
// Export response types
// ---------------------------------------------------------------------------
export interface ExportDashboardSuccessResponse {
  success: true;
  snapshot: DashboardTemplateSnapshot;
  warnings?: string[];
}

export interface ExportDashboardErrorResponse {
  success: false;
  error: string;
  code:
    | 'DASHBOARD_NOT_FOUND'
    | 'DASHBOARD_ACCESS_DENIED'
    | 'FIELD_BINDING_INVALID'
    | 'DEVICE_BINDING_INVALID'
    | 'EXPORT_SIZE_EXCEEDED'
    | 'SECURITY_SANITIZATION_FAILED'
    | 'UNKNOWN_DEVICE_REFERENCE';
  details?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Import response types
// ---------------------------------------------------------------------------
export interface ImportDashboardSuccessResponse {
  success: true;
  dashboardId: string;
  name: string;
  warnings?: string[];
}

export interface ImportDashboardErrorResponse {
  success: false;
  error: string;
  code:
    | 'SNAPSHOT_VALIDATION_FAILED'
    | 'DEVICE_BINDING_MISSING'
    | 'DEVICE_BINDING_INVALID'
    | 'FIELD_BINDING_INVALID'
    | 'PROJECT_NOT_FOUND'
    | 'DASHBOARD_CREATION_FAILED';
  details?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Security utility: deep strip sensitive fields from any object
// ---------------------------------------------------------------------------
export function stripSensitiveFields<T>(obj: T, depth = 0): T {
  // Prevent infinite recursion
  if (depth > 20) return obj;

  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => stripSensitiveFields(item, depth + 1)) as T;
  }

  if (typeof obj === 'object') {
    const record = obj as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(record)) {
      // Skip sensitive fields (case-insensitive check)
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field.toLowerCase()))) {
        result[key] = '[REDACTED]';
        continue;
      }
      result[key] = stripSensitiveFields(value, depth + 1);
    }

    return result as T;
  }

  return obj;
}

// ---------------------------------------------------------------------------
// Security utility: check for generated data source IDs that need replacement
// ---------------------------------------------------------------------------
export function isGeneratedDataSourceId(id: unknown): boolean {
  if (typeof id !== 'string') return false;
  return GENERATED_PLATFORM_DS_ID_RE.test(id) || GENERATED_HOST_DS_ID_RE.test(id);
}

// ---------------------------------------------------------------------------
// Security utility: check for template device ID
// ---------------------------------------------------------------------------
export function isTemplateDeviceRef(id: unknown): boolean {
  return id === TEMPLATE_DEVICE_ID || id === `__platform___template____`;
}

// ---------------------------------------------------------------------------
// Constants for template system
// ---------------------------------------------------------------------------
export const TEMPLATE_DATA_SOURCE_IDS = [
  '__device_platform_template__',
  '__platform___template____',
] as const;

export const MARKET_TEMPLATE_SCHEMA_VERSION = 'thingsvis-1';

// Default canvas config for imported dashboards
export const DEFAULT_MARKET_IMPORT_CANVAS_CONFIG = {
  mode: 'fixed',
  width: 1920,
  height: 1080,
  background: '#1a1a2e',
  theme: 'dawn',
};
