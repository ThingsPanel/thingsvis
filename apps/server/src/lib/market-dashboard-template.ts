export type JsonObject = Record<string, unknown>;

export type MarketDashboardSnapshot = {
  name: string;
  schemaVersion: string;
  canvasConfig: JsonObject;
  nodes: unknown[];
  dataSources: unknown[];
  variables: unknown[];
};

export type DashboardDeviceReference = {
  sourceDeviceId: string;
  sourceDeviceName?: string;
  dataSourceIds: string[];
  fieldIdentifiers: string[];
};

export type DashboardDeviceRole = {
  sourceDeviceId: string;
  bindingKey: string;
  displayName?: string;
};

export type InstalledDeviceBinding = {
  bindingKey: string;
  localDeviceId: string;
};

const PLATFORM_DATA_SOURCE_ID = /^__platform_(.+)__$/;
const BINDING_DATA_SOURCE_ID = /^__platform_binding_([a-z][a-z0-9_]*)__$/;
const BINDING_KEY = /^[a-z][a-z0-9_]{2,63}$/;
const FIELD_EXPRESSION =
  /\{\{\s*ds\.(__platform_.+?__)\.data(?:\.([A-Za-z][A-Za-z0-9_]*)(?:__history)?)?/g;
const HISTORY_FIELD_SUFFIX = '__history';

function isRecord(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function platformDeviceId(dataSourceId: unknown): string | null {
  if (typeof dataSourceId !== 'string') return null;
  if (BINDING_DATA_SOURCE_ID.test(dataSourceId)) return null;
  return PLATFORM_DATA_SOURCE_ID.exec(dataSourceId)?.[1] ?? null;
}

function platformBindingDataSourceId(bindingKey: string): string {
  return `__platform_binding_${bindingKey}__`;
}

function canonicalPlatformDataSourceId(deviceId: string): string {
  return `__platform_${deviceId}__`;
}

function visitStrings(value: unknown, visitor: (value: string) => void): void {
  if (typeof value === 'string') {
    visitor(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => visitStrings(entry, visitor));
    return;
  }
  if (isRecord(value)) {
    Object.values(value).forEach((entry) => visitStrings(entry, visitor));
  }
}

function collectConfiguredFields(config: JsonObject | undefined): string[] {
  if (!config) return [];
  const fields = new Set<string>();

  if (Array.isArray(config.requestedFields)) {
    config.requestedFields.forEach((field) => {
      if (typeof field === 'string' && field) fields.add(field);
    });
  }

  if (isRecord(config.fieldMappings)) {
    Object.values(config.fieldMappings).forEach((field) => {
      if (typeof field === 'string' && field) fields.add(field);
    });
  }

  return [...fields];
}

export function analyzeMarketDashboard(
  snapshot: MarketDashboardSnapshot,
): DashboardDeviceReference[] {
  const references = new Map<
    string,
    {
      sourceDeviceName?: string;
      dataSourceIds: Set<string>;
      fieldIdentifiers: Set<string>;
    }
  >();
  const dataSourceToDevice = new Map<string, string>();

  for (const value of snapshot.dataSources) {
    if (!isRecord(value)) continue;
    const config = isRecord(value.config) ? value.config : undefined;
    const idDevice = platformDeviceId(value.id);
    const configDevice =
      typeof config?.deviceId === 'string' && config.deviceId !== '__template__'
        ? config.deviceId
        : null;
    const deviceId = configDevice ?? idDevice;
    if (!deviceId) continue;

    const entry = references.get(deviceId) ?? {
      dataSourceIds: new Set<string>(),
      fieldIdentifiers: new Set<string>(),
    };
    if (typeof value.name === 'string' && value.name) entry.sourceDeviceName = value.name;
    if (typeof value.id === 'string') {
      entry.dataSourceIds.add(value.id);
      dataSourceToDevice.set(value.id, deviceId);
    }
    collectConfiguredFields(config).forEach((field) => entry.fieldIdentifiers.add(field));
    references.set(deviceId, entry);
  }

  visitStrings(snapshot, (input) => {
    FIELD_EXPRESSION.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = FIELD_EXPRESSION.exec(input)) !== null) {
      const dataSourceId = match[1];
      if (!dataSourceId) continue;
      const deviceId = dataSourceToDevice.get(dataSourceId) ?? platformDeviceId(dataSourceId);
      if (!deviceId) continue;
      const entry = references.get(deviceId) ?? {
        dataSourceIds: new Set<string>(),
        fieldIdentifiers: new Set<string>(),
      };
      entry.dataSourceIds.add(dataSourceId);
      if (match[2]) {
        const fieldIdentifier = match[2].endsWith(HISTORY_FIELD_SUFFIX)
          ? match[2].slice(0, -HISTORY_FIELD_SUFFIX.length)
          : match[2];
        entry.fieldIdentifiers.add(fieldIdentifier);
      }
      references.set(deviceId, entry);
    }
  });

  return [...references.entries()]
    .map(([sourceDeviceId, reference]) => ({
      sourceDeviceId,
      sourceDeviceName: reference.sourceDeviceName,
      dataSourceIds: [...reference.dataSourceIds].sort(),
      fieldIdentifiers: [...reference.fieldIdentifiers].sort(),
    }))
    .sort((left, right) => left.sourceDeviceId.localeCompare(right.sourceDeviceId));
}

function assertRoleMappings(
  references: DashboardDeviceReference[],
  roles: DashboardDeviceRole[],
): Map<string, string> {
  const sourceToBinding = new Map<string, string>();
  const bindingKeys = new Set<string>();

  for (const role of roles) {
    if (!BINDING_KEY.test(role.bindingKey)) {
      throw new Error(`Invalid bindingKey "${role.bindingKey}"`);
    }
    if (sourceToBinding.has(role.sourceDeviceId)) {
      throw new Error(`Duplicate source device mapping "${role.sourceDeviceId}"`);
    }
    if (bindingKeys.has(role.bindingKey)) {
      throw new Error(`Duplicate bindingKey "${role.bindingKey}"`);
    }
    sourceToBinding.set(role.sourceDeviceId, role.bindingKey);
    bindingKeys.add(role.bindingKey);
  }

  for (const reference of references) {
    if (!sourceToBinding.has(reference.sourceDeviceId)) {
      throw new Error(`Missing role mapping for device "${reference.sourceDeviceId}"`);
    }
  }

  const referencedDeviceIds = new Set(references.map((reference) => reference.sourceDeviceId));
  for (const role of roles) {
    if (!referencedDeviceIds.has(role.sourceDeviceId)) {
      throw new Error(`Role maps unknown device "${role.sourceDeviceId}"`);
    }
  }

  return sourceToBinding;
}

function replaceKnownDataSourceIds(value: unknown, replacements: Map<string, string>): unknown {
  if (typeof value === 'string') {
    let result = value;
    for (const [source, replacement] of replacements) {
      result = result.split(source).join(replacement);
    }
    return result;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => replaceKnownDataSourceIds(entry, replacements));
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        replaceKnownDataSourceIds(entry, replacements),
      ]),
    );
  }
  return value;
}

function roleMarker(bindingKey: string): JsonObject {
  return { $deviceBinding: bindingKey };
}

function exportDataSources(
  dataSources: unknown[],
  sourceToBinding: Map<string, string>,
): { dataSources: unknown[]; dataSourceIdReplacements: Map<string, string> } {
  const replacements = new Map<string, string>();
  const exported = dataSources.map((value) => {
    if (!isRecord(value)) return value;
    const config = isRecord(value.config) ? { ...value.config } : undefined;
    const sourceDeviceId =
      (typeof config?.deviceId === 'string' ? config.deviceId : null) ?? platformDeviceId(value.id);
    if (!sourceDeviceId) return { ...value, ...(config ? { config } : {}) };

    const bindingKey = sourceToBinding.get(sourceDeviceId);
    if (!bindingKey) throw new Error(`Missing role mapping for device "${sourceDeviceId}"`);

    const nextId =
      typeof value.id === 'string' ? platformBindingDataSourceId(bindingKey) : value.id;
    if (typeof value.id === 'string') replacements.set(value.id, String(nextId));

    if (config) {
      delete config.deviceId;
      config.deviceBinding = roleMarker(bindingKey);
    }

    return {
      ...value,
      id: nextId,
      ...(config ? { config } : {}),
    };
  });

  return { dataSources: exported, dataSourceIdReplacements: replacements };
}

function assertNoSourceDeviceIds(value: unknown, sourceDeviceIds: Iterable<string>): void {
  const serialized = JSON.stringify(value);
  for (const sourceDeviceId of sourceDeviceIds) {
    if (serialized.includes(sourceDeviceId)) {
      throw new Error(`Export still contains source device ID "${sourceDeviceId}"`);
    }
  }
}

export function exportMarketDashboard(
  snapshot: MarketDashboardSnapshot,
  roles: DashboardDeviceRole[],
): {
  snapshot: MarketDashboardSnapshot;
  deviceReferences: DashboardDeviceReference[];
} {
  const references = analyzeMarketDashboard(snapshot);
  const sourceToBinding = assertRoleMappings(references, roles);
  const { dataSources, dataSourceIdReplacements } = exportDataSources(
    snapshot.dataSources,
    sourceToBinding,
  );

  const exported = replaceKnownDataSourceIds(
    {
      ...snapshot,
      dataSources,
    },
    dataSourceIdReplacements,
  ) as MarketDashboardSnapshot;

  assertNoSourceDeviceIds(exported, sourceToBinding.keys());
  return { snapshot: exported, deviceReferences: references };
}

function assertInstalledBindings(bindings: InstalledDeviceBinding[]): Map<string, string> {
  const bindingToDevice = new Map<string, string>();
  for (const binding of bindings) {
    if (!BINDING_KEY.test(binding.bindingKey)) {
      throw new Error(`Invalid bindingKey "${binding.bindingKey}"`);
    }
    if (!binding.localDeviceId) {
      throw new Error(`Missing local device for binding "${binding.bindingKey}"`);
    }
    if (bindingToDevice.has(binding.bindingKey)) {
      throw new Error(`Duplicate bindingKey "${binding.bindingKey}"`);
    }
    bindingToDevice.set(binding.bindingKey, binding.localDeviceId);
  }
  return bindingToDevice;
}

function importBindingMarkers(value: unknown, bindingToDevice: Map<string, string>): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => importBindingMarkers(entry, bindingToDevice));
  }
  if (!isRecord(value)) return value;

  if (Object.keys(value).length === 1 && typeof value.$deviceBinding === 'string') {
    const deviceId = bindingToDevice.get(value.$deviceBinding);
    if (!deviceId) throw new Error(`Missing device binding "${value.$deviceBinding}"`);
    return deviceId;
  }

  const result: JsonObject = {};
  for (const [key, entry] of Object.entries(value)) {
    result[key] = importBindingMarkers(entry, bindingToDevice);
  }
  return result;
}

function importDataSourceConfigs(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(importDataSourceConfigs);
  if (!isRecord(value)) return value;

  const result: JsonObject = {};
  for (const [key, entry] of Object.entries(value)) {
    result[key] = importDataSourceConfigs(entry);
  }

  if (isRecord(result.config) && typeof result.config.deviceBinding === 'string') {
    result.config = {
      ...result.config,
      deviceId: result.config.deviceBinding,
    };
    delete (result.config as JsonObject).deviceBinding;
  }
  return result;
}

export function importMarketDashboard(
  snapshot: MarketDashboardSnapshot,
  bindings: InstalledDeviceBinding[],
): MarketDashboardSnapshot {
  const bindingToDevice = assertInstalledBindings(bindings);
  const replacements = new Map<string, string>();

  visitStrings(snapshot, (input) => {
    const match = BINDING_DATA_SOURCE_ID.exec(input);
    if (!match?.[1]) return;
    const deviceId = bindingToDevice.get(match[1]);
    if (!deviceId) throw new Error(`Missing device binding "${match[1]}"`);
    replacements.set(match[0], canonicalPlatformDataSourceId(deviceId));
  });

  const withDeviceIds = importBindingMarkers(snapshot, bindingToDevice);
  const withConfigDeviceIds = importDataSourceConfigs(withDeviceIds);
  const imported = replaceKnownDataSourceIds(
    withConfigDeviceIds,
    replacements,
  ) as MarketDashboardSnapshot;
  const serialized = JSON.stringify(imported);

  if (serialized.includes('$deviceBinding') || serialized.includes('__platform_binding_')) {
    throw new Error('Dashboard import contains unresolved device bindings');
  }

  return imported;
}
