/**
 * Device Binding Extraction Utility
 *
 * Extracts deviceBindings[] and fieldBindings[] from dashboard content.
 * This converts concrete device references (deviceId, dataSourceId) into
 * abstract bindingKey references for the market template system.
 */

import type { DataSource } from '@thingsvis/schema';
import type {
  DeviceBinding,
  DeviceBindingInput,
  FieldBinding,
  FieldBindingInput,
} from './validators';
import { normalizeBindingKey } from './validators';

// Pattern to extract data source ID from binding expressions like `ds.xxx.data`
const DATA_SOURCE_EXPRESSION_RE = /ds\.([^\s.}]+)(?:\.|$)/g;

// Pattern to detect platform/generated data source IDs
const PLATFORM_DS_ID_RE = /^__platform_.+__$/;
const THINGSPANEL_DS_ID_RE = /^thingspanel_.+$/;
const GENERIC_TEMPLATE_DS_IDS = ['__device_platform_template__', '__platform___template____'];

// Known device binding hints (provided by user during export)
export interface DeviceBindingHint {
  bindingKey: string;
  deviceTemplateKey: string;
  deviceId?: string;
}

/**
 * Extract referenced data source IDs from any value (deep traversal)
 */
function extractDataSourceReferences(value: unknown, refs: Set<string> = new Set()): Set<string> {
  if (typeof value === 'string') {
    DATA_SOURCE_EXPRESSION_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = DATA_SOURCE_EXPRESSION_RE.exec(value)) !== null) {
      if (match[1]) refs.add(match[1]);
    }
    return refs;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      extractDataSourceReferences(item, refs);
    }
    return refs;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    // Also check dataSourceId field directly
    if (record.dataSourceId && typeof record.dataSourceId === 'string') {
      refs.add(record.dataSourceId);
    }
    for (const item of Object.values(record)) {
      extractDataSourceReferences(item, refs);
    }
  }

  return refs;
}

/**
 * Check if a data source ID is a template/generic device reference
 */
function isTemplateDeviceDataSourceId(id: string): boolean {
  return (
    GENERIC_TEMPLATE_DS_IDS.includes(id) || id === '__template__' || PLATFORM_DS_ID_RE.test(id)
  );
}

/**
 * Check if a data source ID is a real device data source
 */
function isRealDeviceDataSourceId(id: string): boolean {
  // Real devices have IDs that are not platform-generated patterns
  return !isTemplateDeviceDataSourceId(id) && !THINGSPANEL_DS_ID_RE.test(id);
}

/**
 * Extract field references from binding expressions
 */
function extractFieldReferences(value: unknown): Set<string> {
  const fields = new Set<string>();

  if (typeof value === 'string') {
    // Match field references in expressions like ds.xxx.data.fieldName
    const fieldPattern = /ds\.[^\s.}]+\.data\.([A-Za-z_][A-Za-z0-9_]*)/g;
    let match: RegExpExecArray | null;
    while ((match = fieldPattern.exec(value)) !== null) {
      if (match[1]) fields.add(match[1]);
    }
  } else if (Array.isArray(value)) {
    for (const item of value) {
      extractFieldReferences(item).forEach((f) => fields.add(f));
    }
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value as Record<string, unknown>)) {
      extractFieldReferences(item).forEach((f) => fields.add(f));
    }
  }

  return fields;
}

/**
 * Infer field kind from context (heuristic-based)
 */
function inferFieldKind(fieldName: string): 'telemetry' | 'attribute' {
  const telemetryPatterns = [
    /^(temp|temperature|humid|humidity|pressure|flow|level|speed|power|energy|current|voltage)/i,
    /_(temp|temperature|humid|humidity|value|reading)$/i,
  ];

  for (const pattern of telemetryPatterns) {
    if (pattern.test(fieldName)) return 'telemetry';
  }

  return 'telemetry';
}

export interface ExtractionResult {
  deviceBindings: DeviceBinding[];
  fieldBindings: FieldBinding[];
  unboundDataSources: string[];
  warnings: string[];
}

/**
 * Extract deviceBindings and fieldBindings from dashboard content
 *
 * @param dashboard - Dashboard content with nodes, dataSources, variables
 * @param bindingHints - Optional hints to map data sources to device template keys
 * @param availableDeviceTemplates - List of available device template keys (for validation)
 */
export function extractDeviceBindings(
  dashboard: {
    nodes: unknown[];
    dataSources: unknown[];
    variables: unknown[];
  },
  bindingHints: DeviceBindingHint[] = [],
  availableDeviceTemplates: string[] = [],
): ExtractionResult {
  const deviceBindings: DeviceBinding[] = [];
  const fieldBindings: FieldBinding[] = [];
  const unboundDataSources: string[] = [];
  const warnings: string[] = [];

  // Create lookup maps for binding hints
  const hintByDeviceId = new Map<string, DeviceBindingHint>();
  const hintByBindingKey = new Map<string, DeviceBindingHint>();

  for (const hint of bindingHints) {
    hintByBindingKey.set(normalizeBindingKey(hint.bindingKey), {
      ...hint,
      bindingKey: normalizeBindingKey(hint.bindingKey),
    });
    if (hint.deviceId) {
      hintByDeviceId.set(hint.deviceId, {
        ...hint,
        bindingKey: normalizeBindingKey(hint.bindingKey),
      });
    }
  }

  // Process each data source in the dashboard
  for (const ds of dashboard.dataSources) {
    if (!ds || typeof ds !== 'object') continue;

    const dataSource = ds as Record<string, unknown>;
    const dsId = String(dataSource.id ?? '');
    const dsType = String(dataSource.type ?? '').toUpperCase();

    // Skip non-platform data sources
    if (dsType !== 'PLATFORM_FIELD') continue;

    const config = dataSource.config as Record<string, unknown> | null;

    // Determine the binding key for this data source
    let bindingKey: string | null = null;
    let deviceTemplateKey: string | null = null;

    // Check if this is a template device reference
    if (
      isTemplateDeviceDataSourceId(dsId) ||
      isTemplateDeviceDataSourceId(String(config?.deviceId ?? ''))
    ) {
      // For template devices, extract bindingKey from the ID pattern
      const bindingKeyMatch = dsId.match(/^__platform___([^_]+)__$/);
      if (bindingKeyMatch) {
        bindingKey = normalizeBindingKey(bindingKeyMatch[1]);
      } else if (dsId === '__device_platform_template__') {
        // Generic template - use the first hint or generate a key
        const firstHint = bindingHints[0];
        if (firstHint) {
          bindingKey = firstHint.bindingKey;
        } else {
          bindingKey = 'template-device';
        }
      }

      // Look up template key from hints
      if (bindingKey) {
        const hint = hintByBindingKey.get(bindingKey);
        if (hint) {
          deviceTemplateKey = hint.deviceTemplateKey;
        }
      }
    }
    // Check if this is a real device data source
    else if (isRealDeviceDataSourceId(dsId)) {
      const deviceId = String(config?.deviceId ?? dsId);

      // Look up by deviceId first
      let hint = hintByDeviceId.get(deviceId);

      // Then try by dataSourceId
      if (!hint) {
        hint = hintByBindingKey.get(dsId);
      }

      if (hint) {
        bindingKey = normalizeBindingKey(hint.bindingKey);
        deviceTemplateKey = hint.deviceTemplateKey;
      } else {
        // No hint provided - this is a real device reference without mapping
        unboundDataSources.push(dsId);
        warnings.push(`Real device data source '${dsId}' has no binding hint - will be unbound`);
        continue;
      }
    }

    // Validate and add device binding
    if (bindingKey && deviceTemplateKey) {
      // Check for duplicate bindingKeys
      if (deviceBindings.some((db) => db.bindingKey === bindingKey)) {
        warnings.push(`Duplicate bindingKey '${bindingKey}' detected, skipping`);
        continue;
      }

      // Validate device template exists
      if (
        availableDeviceTemplates.length > 0 &&
        !availableDeviceTemplates.includes(deviceTemplateKey)
      ) {
        warnings.push(`Device template '${deviceTemplateKey}' not found in available templates`);
      }

      deviceBindings.push({
        bindingKey,
        deviceTemplateKey,
        required: true,
        allowMany: false,
      });

      // Extract field bindings for this device
      const allFieldRefs = new Set<string>();
      for (const node of dashboard.nodes) {
        extractFieldReferences(node).forEach((f) => allFieldRefs.add(f));
      }
      for (const variable of dashboard.variables) {
        extractFieldReferences(variable).forEach((f) => allFieldRefs.add(f));
      }

      // Filter field refs that look like they belong to this binding
      // (In practice, we need more sophisticated tracking - for now, add telemetry-like fields)
      for (const fieldId of allFieldRefs) {
        if (fieldId && typeof fieldId === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldId)) {
          fieldBindings.push({
            bindingKey,
            kind: inferFieldKind(fieldId),
            identifier: fieldId,
            required: true,
          });
        }
      }
    }
  }

  return {
    deviceBindings,
    fieldBindings,
    unboundDataSources,
    warnings,
  };
}

/**
 * Validate that all fieldBindings reference valid deviceBindings
 */
export function validateFieldBindings(
  fieldBindings: FieldBindingInput[],
  deviceBindings: DeviceBindingInput[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const bindingKeys = new Set(deviceBindings.map((db) => db.bindingKey));

  for (const fb of fieldBindings) {
    if (!bindingKeys.has(fb.bindingKey)) {
      errors.push(`Field binding references unknown bindingKey '${fb.bindingKey}'`);
    }

    if (!['telemetry', 'attribute', 'command', 'event'].includes(fb.kind)) {
      errors.push(`Field binding has invalid kind '${fb.kind}'`);
    }

    if (!fb.identifier || fb.identifier.trim() === '') {
      errors.push('Field binding has empty identifier');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate device binding array
 */
export function validateDeviceBindings(deviceBindings: DeviceBindingInput[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const bindingKeys = new Set<string>();

  for (const db of deviceBindings) {
    // Check for duplicate bindingKeys
    if (bindingKeys.has(db.bindingKey)) {
      errors.push(`Duplicate bindingKey '${db.bindingKey}'`);
    }
    bindingKeys.add(db.bindingKey);

    // Validate naming convention
    if (!/^[a-z][a-z0-9-]*$/.test(db.bindingKey)) {
      errors.push(`bindingKey '${db.bindingKey}' doesn't match pattern ^[a-z][a-z0-9-]*$`);
    }

    if (!/^[a-z][a-z0-9-]*$/.test(db.deviceTemplateKey)) {
      errors.push(
        `deviceTemplateKey '${db.deviceTemplateKey}' doesn't match pattern ^[a-z][a-z0-9-]*$`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
