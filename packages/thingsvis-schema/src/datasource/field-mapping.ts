import { z } from 'zod';

/**
 * A single field mapping rule: maps a JSONPath expression in source data
 * to a named output field in the component's data context.
 *
 * Example:
 *   { from: '$.results[*].temperature', to: 'temp', aggregate: 'last' }
 */
export const FieldMappingRuleSchema = z.object({
  /** JSONPath expression to extract from raw data. Use `$.*` for array flatten. */
  from: z.string().describe('JSONPath expression, e.g. $.items[0].val'),
  /** Output field name available in the widget via `data.fieldName` */
  to: z.string().describe('Output field name in widget data context'),
  /**
   * When `from` resolves to an array, how to collapse it to a scalar.
   * - `last`  → take the last element
   * - `first` → take the first element
   * - `sum`   → numeric sum
   * - `avg`   → numeric average
   * - `none`  → keep as array (default)
   */
  aggregate: z.enum(['last', 'first', 'sum', 'avg', 'none']).default('none'),
  /** Optional default value when path does not resolve */
  defaultValue: z.unknown().optional(),
});

/**
 * Collection of FieldMapping rules applied after raw data is received
 * from an adapter and before it is placed into the store.
 *
 * If the rule list is empty, raw data passes through unchanged.
 */
export const FieldMappingConfigSchema = z.object({
  rules: z.array(FieldMappingRuleSchema).default([]),
  /** When true, the mapped object is merged with the raw data (default: false — replace) */
  merge: z.boolean().default(false),
});

export type FieldMappingRule = z.infer<typeof FieldMappingRuleSchema>;
export type FieldMappingConfig = z.infer<typeof FieldMappingConfigSchema>;

export const DEFAULT_FIELD_MAPPING_CONFIG: FieldMappingConfig = {
  rules: [],
  merge: false,
};
