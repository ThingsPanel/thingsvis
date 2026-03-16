import { resolveEditorServiceConfig } from '../embedded/service-config';
import { extractDefaults } from './schemaUtils';

type ResolveInitialWidgetPropsInput = {
  schema?: unknown;
  standaloneDefaults?: Record<string, unknown>;
  fallbackDefaults?: Record<string, unknown>;
};

export function resolveInitialWidgetProps({
  schema,
  standaloneDefaults,
  fallbackDefaults,
}: ResolveInitialWidgetPropsInput): Record<string, unknown> {
  const schemaDefaults = schema != null ? extractDefaults(schema) : { ...(fallbackDefaults ?? {}) };

  if (resolveEditorServiceConfig().mode !== 'standalone') {
    return schemaDefaults;
  }

  return {
    ...schemaDefaults,
    ...(standaloneDefaults ?? {}),
  };
}
