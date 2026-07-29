/**
 * Market Template Module - Public API
 *
 * This module provides export/import functionality for ThingsPanel Market Solution Bundles.
 */

// Re-export validators and types
export {
  DeviceBindingSchema,
  FieldBindingSchema,
  DashboardTemplateSnapshotSchema,
  ExportDashboardQuerySchema,
  ImportDashboardBodySchema,
  stripSensitiveFields,
  isGeneratedDataSourceId,
  isTemplateDeviceRef,
  TEMPLATE_DATA_SOURCE_IDS,
  MARKET_TEMPLATE_SCHEMA_VERSION,
  DEFAULT_MARKET_IMPORT_CANVAS_CONFIG,
} from './validators';

export type {
  DeviceBinding,
  FieldBinding,
  DashboardTemplateSnapshot,
  ExportDashboardQuery,
  ImportDashboardBody,
  ExportDashboardSuccessResponse,
  ExportDashboardErrorResponse,
  ImportDashboardSuccessResponse,
  ImportDashboardErrorResponse,
} from './validators';

// Re-export binding extractor
export {
  extractDeviceBindings,
  validateDeviceBindings,
  validateFieldBindings,
} from './binding-extractor';

export type { ExtractionResult } from './binding-extractor';

// Re-export security utilities
export {
  deepSanitize,
  sanitizeDashboardForExport,
  sanitizeDataSourceForExport,
  replaceDeviceReferencesWithTemplates,
  checkExportSize,
  validateImportedSnapshot,
  EXPORT_SIZE_LIMITS,
} from './security';

export type { SanitizationResult } from './security';
