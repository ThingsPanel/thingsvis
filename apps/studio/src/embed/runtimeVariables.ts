export type RuntimeVariableDefinition = {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue?: unknown;
  description?: string;
};

export const EMBED_RUNTIME_VARIABLES: RuntimeVariableDefinition[] = [
  { name: 'platformApiBaseUrl', type: 'string', defaultValue: '' },
  { name: 'thingsvisApiBaseUrl', type: 'string', defaultValue: '' },
  { name: 'deviceId', type: 'string', defaultValue: '' },
  { name: 'dateRange', type: 'object', defaultValue: { startTime: '', endTime: '' } },
];

// These runtime-managed URLs use the current host only as a fallback. If a
// dashboard/template already stores an explicit URL, keep it so local testing
// can target a remote ThingsPanel backend.
const RUNTIME_MANAGED_DEFAULT_NAMES = new Set(['platformApiBaseUrl', 'thingsvisApiBaseUrl']);

function readConfigString(config: Record<string, unknown> | undefined, key: string) {
  const value = config?.[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function resolveThingsVisApiBaseUrl(config: Record<string, unknown> | undefined) {
  return readConfigString(config, 'thingsvisApiBaseUrl');
}

export function buildEmbedRuntimeVariableValues(
  config: Record<string, unknown> | undefined,
  fallbackDeviceId?: string | null,
): Record<string, unknown> {
  const platformApiBaseUrl = readConfigString(config, 'platformApiBaseUrl');
  const thingsvisApiBaseUrl = resolveThingsVisApiBaseUrl(config);
  const platformToken =
    readConfigString(config, 'platformToken') || readConfigString(config, 'token');
  const deviceId = readConfigString(config, 'deviceId') || fallbackDeviceId || undefined;
  const dateRange = config?.dateRange;

  return {
    ...(platformApiBaseUrl ? { platformApiBaseUrl } : {}),
    ...(thingsvisApiBaseUrl ? { thingsvisApiBaseUrl } : {}),
    ...(platformToken ? { platformToken } : {}),
    ...(deviceId ? { deviceId } : {}),
    ...(dateRange && typeof dateRange === 'object' ? { dateRange } : {}),
  };
}

function readSavedRuntimeDefault(
  definitions: unknown[] | undefined,
  name: string,
): unknown | undefined {
  if (!Array.isArray(definitions)) return undefined;

  const definition = definitions.find(
    (entry): entry is RuntimeVariableDefinition =>
      Boolean(entry) &&
      typeof entry === 'object' &&
      typeof (entry as RuntimeVariableDefinition).name === 'string' &&
      (entry as RuntimeVariableDefinition).name === name,
  );
  const defaultValue = definition?.defaultValue;
  return typeof defaultValue === 'string' && defaultValue.trim().length > 0
    ? defaultValue
    : undefined;
}

export function resolveEmbedRuntimeVariableValues(
  definitions: unknown[] | undefined,
  runtimeValues: Record<string, unknown>,
): Record<string, unknown> {
  const resolvedValues = { ...runtimeValues };

  RUNTIME_MANAGED_DEFAULT_NAMES.forEach((name) => {
    const savedDefault = readSavedRuntimeDefault(definitions, name);
    if (savedDefault !== undefined) {
      resolvedValues[name] = savedDefault;
    }
  });

  return resolvedValues;
}

export function mergeEmbedRuntimeVariableDefinitions(
  definitions: unknown[] | undefined,
  runtimeValues: Record<string, unknown>,
): RuntimeVariableDefinition[] {
  const merged = Array.isArray(definitions)
    ? ([...definitions] as RuntimeVariableDefinition[]).map((definition) => {
        if (!definition || typeof definition !== 'object') return definition;
        const name = definition.name;
        if (typeof name !== 'string' || !RUNTIME_MANAGED_DEFAULT_NAMES.has(name)) {
          return definition;
        }

        const runtimeValue = runtimeValues[name];
        if (runtimeValue === undefined) return definition;
        if (
          typeof definition.defaultValue === 'string' &&
          definition.defaultValue.trim().length > 0
        ) {
          return definition;
        }

        return {
          ...definition,
          defaultValue: runtimeValue,
        };
      })
    : [];
  const existingNames = new Set(
    merged
      .map((definition) => definition?.name)
      .filter((name): name is string => typeof name === 'string' && name.length > 0),
  );

  EMBED_RUNTIME_VARIABLES.forEach((definition) => {
    if (existingNames.has(definition.name)) return;
    merged.push({
      ...definition,
      defaultValue: runtimeValues[definition.name] ?? definition.defaultValue,
    });
  });

  return merged;
}
