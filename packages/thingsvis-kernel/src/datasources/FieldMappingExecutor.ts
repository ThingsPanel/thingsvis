import type { FieldMappingConfig, FieldMappingRule } from '@thingsvis/schema';
import { JsonPathResolver } from './JsonPathResolver';

/**
 * FieldMappingExecutor: applies FieldMapping rules to raw adapter data.
 *
 * Usage:
 *   const mapped = FieldMappingExecutor.apply(rawData, config);
 *
 * When `config.rules` is empty, returns `rawData` unchanged.
 * When `config.merge` is true, merges mapped fields into rawData.
 */
export class FieldMappingExecutor {
  /**
   * Apply a FieldMappingConfig to raw data and return the transformed result.
   *
   * @param raw    Raw data emitted by the adapter
   * @param config FieldMappingConfig from the DataSource v2 configuration
   * @returns      Transformed data object or `raw` if no rules defined
   */
  static apply(raw: unknown, config: FieldMappingConfig): unknown {
    if (!config || !config.rules || config.rules.length === 0) {
      return raw;
    }

    const mapped: Record<string, unknown> = {};

    for (const rule of config.rules) {
      try {
        const value = FieldMappingExecutor.applyRule(raw, rule);
        mapped[rule.to] = value ?? rule.defaultValue;
      } catch (e) {
        console.warn(`[FieldMappingExecutor] Rule "${rule.from}" → "${rule.to}" failed:`, e);
        mapped[rule.to] = rule.defaultValue;
      }
    }

    if (config.merge && raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
      return { ...(raw as Record<string, unknown>), ...mapped };
    }

    return mapped;
  }

  private static applyRule(raw: unknown, rule: FieldMappingRule): unknown {
    let resolved = JsonPathResolver.resolve(rule.from, raw);
    resolved = JsonPathResolver.aggregate(resolved, rule.aggregate);
    return resolved;
  }

  /**
   * Validate that all JSONPath expressions in a FieldMappingConfig are parseable.
   * Returns an array of error messages (empty → all valid).
   */
  static validate(config: FieldMappingConfig): string[] {
    const errors: string[] = [];
    for (const rule of config.rules) {
      try {
        JsonPathResolver.resolve(rule.from, {});
      } catch (e) {
        errors.push(`Rule "${rule.from}" → "${rule.to}": ${(e as Error).message}`);
      }
    }
    return errors;
  }
}
