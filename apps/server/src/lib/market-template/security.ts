/**
 * Security Sanitization Utility for Market Template Export/Import
 *
 * Ensures no sensitive runtime data (real device IDs, tenant IDs, tokens, etc.)
 * leaks into exported templates, and validates imported content for safety.
 */

import type { DataSource } from '@thingsvis/schema';
import type { DashboardTemplateSnapshotInput } from './validators';

// ---------------------------------------------------------------------------
// Patterns for sensitive data detection
// ---------------------------------------------------------------------------

// Pattern for generated platform data source IDs
const GENERATED_PLATFORM_DS_ID_RE = /^__platform_.+__$/;

// Pattern for generated host data source IDs (from ThingsPanel)
const GENERATED_HOST_DS_ID_RE = /^(?:__platform_.+__|thingspanel_.+)$/;

// Pattern for template device data source IDs
const TEMPLATE_DS_IDS = ['__device_platform_template__', '__platform___template____'];

// Pattern for UUID v4 (real entity IDs)
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Pattern for CUID (Prisma IDs)
const CUID_RE = /^c[lns][0-9a-z]{24,25}$/i;

// Pattern for share tokens (UUID format typically)
const SHARE_TOKEN_RE = /^[0-9a-f-]{32,36}$/i;

// ---------------------------------------------------------------------------
// Sensitive field names that must be stripped
// ---------------------------------------------------------------------------

const SENSITIVE_FIELD_NAMES = new Set([
  'deviceId',
  'tenantId',
  'userId',
  'shareToken',
  'password',
  'secret',
  'token',
  'apiKey',
  'api_key',
  'accessToken',
  'refreshToken',
  'bearerToken',
]);

const SENSITIVE_FIELD_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /credential/i,
  /auth/i,
];

function isSensitiveFieldName(name: string): boolean {
  const lower = name.toLowerCase();
  if (SENSITIVE_FIELD_NAMES.has(lower)) return true;
  return SENSITIVE_FIELD_PATTERNS.some((pattern) => pattern.test(lower));
}

// ---------------------------------------------------------------------------
// Size limits for security
// ---------------------------------------------------------------------------

export const EXPORT_SIZE_LIMITS = {
  maxNodesSize: 10 * 1024 * 1024, // 10 MB
  maxDataSourcesSize: 2 * 1024 * 1024, // 2 MB
  maxVariablesSize: 512 * 1024, // 512 KB
  maxCanvasConfigSize: 512 * 1024, // 512 KB
  maxTotalSize: 15 * 1024 * 1024, // 15 MB
  maxInlineSvgSize: 100 * 1024, // 100 KB per SVG
  maxScriptSize: 50 * 1024, // 50 KB per script block
} as const;

// ---------------------------------------------------------------------------
// Sanitization functions
// ---------------------------------------------------------------------------

export interface SanitizationResult {
  sanitized: unknown;
  replacedFields: string[];
  detectedIssues: string[];
}

function sanitizeValue(value: unknown, path: string[] = []): SanitizationResult {
  const replacedFields: string[] = [];
  const detectedIssues: string[] = [];

  if (value === null || value === undefined) {
    return { sanitized: value, replacedFields, detectedIssues };
  }

  if (typeof value === 'string') {
    // Check for suspicious content
    if (value.includes('javascript:') || value.includes('data:text/html')) {
      detectedIssues.push(`Suspicious URI scheme at path: ${path.join('.')}`);
    }
    return { sanitized: value, replacedFields, detectedIssues };
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return { sanitized: value, replacedFields, detectedIssues };
  }

  if (Array.isArray(value)) {
    const sanitized: unknown[] = [];
    for (let i = 0; i < value.length; i++) {
      const result = sanitizeValue(value[i], [...path, String(i)]);
      sanitized.push(result.sanitized);
      replacedFields.push(...result.replacedFields);
      detectedIssues.push(...result.detectedIssues);
    }
    return { sanitized, replacedFields, detectedIssues };
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(record)) {
      const currentPath = [...path, key];

      // Check if this field name is sensitive
      if (isSensitiveFieldName(key)) {
        // Check for real ID patterns that should be stripped
        if (typeof val === 'string') {
          if (UUID_V4_RE.test(val) || CUID_RE.test(val)) {
            replacedFields.push(currentPath.join('.'));
            sanitized[key] = '[REDACTED_ID]';
            continue;
          }
          if (SHARE_TOKEN_RE.test(val) && key.toLowerCase().includes('share')) {
            replacedFields.push(currentPath.join('.'));
            sanitized[key] = '[REDACTED_TOKEN]';
            continue;
          }
        }
        // For other sensitive fields, check if they're actual secrets
        if (typeof val === 'string' && val.length > 0 && !val.startsWith('__')) {
          replacedFields.push(currentPath.join('.'));
          sanitized[key] = '[REDACTED]';
          continue;
        }
      }

      const result = sanitizeValue(val, currentPath);
      sanitized[key] = result.sanitized;
      replacedFields.push(...result.replacedFields);
      detectedIssues.push(...result.detectedIssues);
    }

    return { sanitized, replacedFields, detectedIssues };
  }

  return { sanitized: value, replacedFields, detectedIssues };
}

/**
 * Deep sanitize an object, stripping sensitive fields and detecting issues
 */
export function deepSanitize(value: unknown): SanitizationResult {
  return sanitizeValue(value);
}

/**
 * Sanitize dashboard content for export
 * Removes real IDs, tokens, and other sensitive data
 */
export function sanitizeDashboardForExport(dashboard: {
  canvasConfig?: unknown;
  nodes?: unknown[];
  dataSources?: unknown[];
  variables?: unknown[];
}): {
  canvasConfig: unknown;
  nodes: unknown[];
  dataSources: unknown[];
  variables: unknown[];
  replacedFields: string[];
  detectedIssues: string[];
} {
  const replacedFields: string[] = [];
  const detectedIssues: string[] = [];

  const sanitizeSection = (section: unknown, name: string): unknown => {
    const result = deepSanitize(section);
    replacedFields.push(...result.replacedFields.map((p) => `${name}.${p}`));
    detectedIssues.push(...result.detectedIssues.map((i) => `${name}: ${i}`));
    return result.sanitized;
  };

  return {
    canvasConfig: sanitizeSection(dashboard.canvasConfig ?? {}, 'canvasConfig'),
    // sanitizeSection preserves shape, so an array section stays an array.
    nodes: sanitizeSection(dashboard.nodes ?? [], 'nodes') as unknown[],
    dataSources: sanitizeSection(dashboard.dataSources ?? [], 'dataSources') as unknown[],
    variables: sanitizeSection(dashboard.variables ?? [], 'variables') as unknown[],
    replacedFields,
    detectedIssues,
  };
}

/**
 * Sanitize a data source by removing real device IDs and platform-specific fields
 */
export function sanitizeDataSourceForExport(dataSource: DataSource): DataSource {
  const result: DataSource = { ...dataSource };

  // For PLATFORM_FIELD type, remove real deviceId if present
  if (result.type === 'PLATFORM_FIELD') {
    const config = result.config as Record<string, unknown>;
    if (config && typeof config === 'object') {
      // Replace deviceId with placeholder
      if (config.deviceId && String(config.deviceId) !== '__template__') {
        config.deviceId = '__template__';
      }
      // Remove any tenant/platform specific fields
      if ('tenantId' in config) delete config.tenantId;
      if ('userId' in config) delete config.userId;
    }
  }

  // Remove any sensitive fields
  for (const key of Object.keys(result)) {
    if (isSensitiveFieldName(key)) {
      delete (result as Record<string, unknown>)[key];
    }
  }

  return result;
}

/**
 * Replace real device data source references with template placeholders
 */
export function replaceDeviceReferencesWithTemplates(dataSources: unknown[]): {
  dataSources: unknown[];
  replacedIds: string[];
  warnings: string[];
} {
  const replacedIds: string[] = [];
  const warnings: string[] = [];

  const sanitized = dataSources.map((ds) => {
    if (!ds || typeof ds !== 'object') return ds;

    const dataSource = ds as Record<string, unknown>;
    const dsId = String(dataSource.id ?? '');
    const dsType = String(dataSource.type ?? '').toUpperCase();

    // For PLATFORM_FIELD data sources
    if (dsType === 'PLATFORM_FIELD') {
      const config = dataSource.config as Record<string, unknown> | undefined;

      // Check if this is a template device reference
      if (TEMPLATE_DS_IDS.includes(dsId) || dsId.includes('__template__')) {
        // Already a template reference - keep as is
        return dataSource;
      }

      // Check if this is a generated platform ID
      if (GENERATED_PLATFORM_DS_ID_RE.test(dsId) || GENERATED_HOST_DS_ID_RE.test(dsId)) {
        // Check for real device ID in config
        const deviceId = config?.deviceId;
        if (deviceId && String(deviceId) !== '__template__' && !String(deviceId).startsWith('__')) {
          // This is a real device - mark for replacement
          replacedIds.push(dsId);
          warnings.push(`Replacing real device data source '${dsId}' with template placeholder`);

          return {
            ...dataSource,
            id: '__device_platform_template__',
            config: {
              ...config,
              deviceId: '__template__',
            },
          };
        }
      }
    }

    return dataSource;
  });

  return { dataSources: sanitized, replacedIds, warnings };
}

/**
 * Check content size for export limits
 */
export function checkExportSize(dashboard: {
  canvasConfig?: unknown;
  nodes?: unknown[];
  dataSources?: unknown[];
  variables?: unknown[];
}): {
  withinLimits: boolean;
  oversized: string[];
  totalSize: number;
} {
  const oversized: string[] = [];

  const getSize = (obj: unknown): number => {
    return new Blob([JSON.stringify(obj)]).size;
  };

  const canvasSize = getSize(dashboard.canvasConfig ?? {});
  const nodesSize = getSize(dashboard.nodes ?? []);
  const dataSourcesSize = getSize(dashboard.dataSources ?? []);
  const variablesSize = getSize(dashboard.variables ?? []);

  if (canvasSize > EXPORT_SIZE_LIMITS.maxCanvasConfigSize) {
    oversized.push(`canvasConfig (${canvasSize} > ${EXPORT_SIZE_LIMITS.maxCanvasConfigSize})`);
  }
  if (nodesSize > EXPORT_SIZE_LIMITS.maxNodesSize) {
    oversized.push(`nodes (${nodesSize} > ${EXPORT_SIZE_LIMITS.maxNodesSize})`);
  }
  if (dataSourcesSize > EXPORT_SIZE_LIMITS.maxDataSourcesSize) {
    oversized.push(`dataSources (${dataSourcesSize} > ${EXPORT_SIZE_LIMITS.maxDataSourcesSize})`);
  }
  if (variablesSize > EXPORT_SIZE_LIMITS.maxVariablesSize) {
    oversized.push(`variables (${variablesSize} > ${EXPORT_SIZE_LIMITS.maxVariablesSize})`);
  }

  const totalSize = canvasSize + nodesSize + dataSourcesSize + variablesSize;
  if (totalSize > EXPORT_SIZE_LIMITS.maxTotalSize) {
    oversized.push(`total (${totalSize} > ${EXPORT_SIZE_LIMITS.maxTotalSize})`);
  }

  return {
    withinLimits: oversized.length === 0,
    oversized,
    totalSize,
  };
}

/**
 * Validate imported snapshot for safety
 */
export function validateImportedSnapshot(snapshot: DashboardTemplateSnapshotInput): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for suspicious patterns in content
  const checkForSuspiciousContent = (obj: unknown, path: string[] = []): void => {
    if (typeof obj === 'string') {
      // Check for executable content
      if (
        obj.includes('javascript:') ||
        obj.includes('data:text/html') ||
        obj.includes('<script')
      ) {
        errors.push(`Potentially unsafe content at ${path.join('.')}: contains script or data URI`);
      }
      return;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, i) => checkForSuspiciousContent(item, [...path, String(i)]));
    } else if (obj && typeof obj === 'object') {
      const record = obj as Record<string, unknown>;
      for (const [key, val] of Object.entries(record)) {
        // Check field names
        if (isSensitiveFieldName(key) && typeof val === 'string' && val.length > 0) {
          if (!val.startsWith('__') && !val.startsWith('[REDACTED')) {
            errors.push(
              `Potentially sensitive field '${key}' at ${path.join('.')} has unredacted value`,
            );
          }
        }
        checkForSuspiciousContent(val, [...path, key]);
      }
    }
  };

  checkForSuspiciousContent(snapshot.nodes);
  checkForSuspiciousContent(snapshot.dataSources);
  checkForSuspiciousContent(snapshot.variables);

  // Check deviceBindings are properly structured
  for (const db of snapshot.deviceBindings) {
    if (!/^[a-z][a-z0-9-]*$/.test(db.bindingKey)) {
      errors.push(`Invalid bindingKey format: '${db.bindingKey}'`);
    }
  }

  // Check fieldBindings reference valid bindingKeys
  const bindingKeys = new Set(snapshot.deviceBindings.map((db) => db.bindingKey));
  for (const fb of snapshot.fieldBindings ?? []) {
    if (!bindingKeys.has(fb.bindingKey)) {
      errors.push(`Field binding references unknown bindingKey: '${fb.bindingKey}'`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
