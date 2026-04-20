import { resolveEditorServiceConfig } from '../embedded/service-config';
import { extractDefaults } from './schemaUtils';

type ResolveInitialWidgetPropsInput = {
  schema?: unknown;
  standaloneDefaults?: Record<string, unknown>;
  previewDefaults?: Record<string, unknown>;
  sampleData?: Record<string, unknown>;
  fallbackDefaults?: Record<string, unknown>;
};

/**
 * Resolve initial widget props with a fixed priority chain.
 *
 * Priority (highest → lowest):
 *   1. Canonical schema defaults — extracted from the widget's Zod schema
 *      via `extractDefaults()`. This is the ground truth for every field
 *      that has a `.default()` in its Zod definition.
 *
 *   2. standaloneDefaults — demo / standalone-only overrides declared by
 *      the widget author in `WidgetMainModule.standaloneDefaults`.
 *      These are merged **over** schema defaults ONLY when
 *      `mode === 'standalone'`. Embedded hosts ignore them.
 *
 *   3. fallbackDefaults (migration layer) — used ONLY when no Zod schema
 *      is available (legacy widgets). Will be removed once all widgets
 *      provide a schema.
 */
export function resolveInitialWidgetProps({
  schema,
  standaloneDefaults,
  previewDefaults,
  sampleData,
  fallbackDefaults,
}: ResolveInitialWidgetPropsInput): Record<string, unknown> {
  // Priority 1: canonical schema defaults (or migration fallback if no schema)
  const schemaDefaults = schema != null ? extractDefaults(schema) : { ...(fallbackDefaults ?? {}) };

  if (resolveEditorServiceConfig().mode !== 'standalone') {
    return {
      ...schemaDefaults,
      ...(sampleData ?? {}),
      ...(previewDefaults ?? {}),
    };
  }

  // Priority 2: merge standaloneDefaults over schema defaults (standalone only)
  return {
    ...schemaDefaults,
    ...(standaloneDefaults ?? {}),
  };
}
