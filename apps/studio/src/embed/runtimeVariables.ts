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

export function mergeEmbedRuntimeVariableDefinitions(
  definitions: unknown[] | undefined,
  runtimeValues: Record<string, unknown>,
): RuntimeVariableDefinition[] {
  const merged = Array.isArray(definitions)
    ? ([...definitions] as RuntimeVariableDefinition[])
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
