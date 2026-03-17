import { type DataSource, type PlatformFieldConfig } from '@thingsvis/schema';

const FIELD_BINDING_EXPR_RE = /\{\{\s*ds\.([^.\s]+)\.data(?:\.([^}]+?))?\s*\}\}/g;
export const DEFAULT_HISTORY_BUFFER_SIZE = 100;

type PlatformBindingRequirement = {
  needsHistory: boolean;
  requestedFields: Set<string>;
};

function visitStringLeaves(value: unknown, visitor: (input: string) => void): void {
  if (typeof value === 'string') {
    visitor(value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => visitStringLeaves(entry, visitor));
    return;
  }

  if (value && typeof value === 'object') {
    Object.values(value).forEach((entry) => visitStringLeaves(entry, visitor));
  }
}

function isPlatformDataSourceId(dataSourceId: string): boolean {
  return dataSourceId === '__platform__' || /^__platform_(.+)__$/.test(dataSourceId);
}

function getFieldRoot(fieldPath?: string): string | null {
  if (!fieldPath) return null;
  const [root] = fieldPath.split(/[.[\]]/).filter(Boolean);
  return root?.trim() ? root.trim() : null;
}

export function collectPlatformBindingRequirements(
  nodes: Array<Record<string, unknown>>,
): Map<string, PlatformBindingRequirement> {
  const requirements = new Map<string, PlatformBindingRequirement>();

  const ensureRequirement = (dataSourceId: string): PlatformBindingRequirement => {
    const existing = requirements.get(dataSourceId);
    if (existing) return existing;

    const next: PlatformBindingRequirement = {
      needsHistory: false,
      requestedFields: new Set<string>(),
    };
    requirements.set(dataSourceId, next);
    return next;
  };

  nodes.forEach((node) => {
    visitStringLeaves(node, (input) => {
      FIELD_BINDING_EXPR_RE.lastIndex = 0;

      let match: RegExpExecArray | null;
      while ((match = FIELD_BINDING_EXPR_RE.exec(input)) !== null) {
        const dataSourceId = match[1];
        if (!dataSourceId || !isPlatformDataSourceId(dataSourceId)) continue;

        const fieldRoot = getFieldRoot(match[2]);
        if (!fieldRoot) continue;

        const requirement = ensureRequirement(dataSourceId);
        requirement.requestedFields.add(fieldRoot);
        if (fieldRoot.endsWith('__history')) {
          requirement.needsHistory = true;
        }
      }
    });
  });

  return requirements;
}

function normalizeBufferSize(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

export function augmentPlatformDataSourcesForNodes(
  dataSources: DataSource[],
  nodes: Array<Record<string, unknown>>,
  defaultHistoryBufferSize: number = DEFAULT_HISTORY_BUFFER_SIZE,
): DataSource[] {
  const requirements = collectPlatformBindingRequirements(nodes);
  if (requirements.size === 0) return dataSources;

  const inferredBufferSize =
    dataSources
      .map((dataSource) =>
        normalizeBufferSize((dataSource.config as PlatformFieldConfig | undefined)?.bufferSize),
      )
      .filter((bufferSize) => bufferSize > 0)
      .reduce((max, current) => Math.max(max, current), 0) || defaultHistoryBufferSize;

  const nextById = new Map<string, DataSource>(
    dataSources.map((dataSource) => [dataSource.id, dataSource]),
  );

  requirements.forEach((requirement, dataSourceId) => {
    const baseDataSource = nextById.get(dataSourceId);
    if (!baseDataSource) return;

    const baseConfig = (baseDataSource.config ?? {}) as PlatformFieldConfig;
    const existingBufferSize = normalizeBufferSize(baseConfig.bufferSize);

    nextById.set(dataSourceId, {
      ...baseDataSource,
      type: 'PLATFORM_FIELD',
      config: {
        ...baseConfig,
        requestedFields: Array.from(
          new Set([...(baseConfig.requestedFields ?? []), ...requirement.requestedFields]),
        ),
        bufferSize: requirement.needsHistory
          ? Math.max(existingBufferSize, inferredBufferSize)
          : existingBufferSize,
      },
    });
  });

  return Array.from(nextById.values());
}
