import { type NodeState } from '@thingsvis/kernel';
import { SafeExecutor } from '@thingsvis/kernel';
import { ExpressionEvaluator } from '@thingsvis/utils';

type HistoryConfig = {
  timeRange?: unknown;
  aggFunction?: unknown;
  aggWindow?: unknown;
};

type ParsedHistoryPoint = {
  timeMs: number;
  value: number;
  source: unknown;
};

const HISTORY_TIME_RANGE_MS: Record<string, number> = {
  last_5m: 5 * 60 * 1000,
  last_15m: 15 * 60 * 1000,
  last_30m: 30 * 60 * 1000,
  last_1h: 60 * 60 * 1000,
  last_3h: 3 * 60 * 60 * 1000,
  last_6h: 6 * 60 * 60 * 1000,
  last_12h: 12 * 60 * 60 * 1000,
  last_24h: 24 * 60 * 60 * 1000,
  last_3d: 3 * 24 * 60 * 60 * 1000,
  last_7d: 7 * 24 * 60 * 60 * 1000,
  last_15d: 15 * 24 * 60 * 60 * 1000,
  last_30d: 30 * 24 * 60 * 60 * 1000,
  last_60d: 60 * 24 * 60 * 60 * 1000,
  last_90d: 90 * 24 * 60 * 60 * 1000,
  last_6m: 183 * 24 * 60 * 60 * 1000,
  last_1y: 365 * 24 * 60 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

const HISTORY_AGG_WINDOW_MS: Record<string, number> = {
  '30s': 30 * 1000,
  '1m': 60 * 1000,
  '2m': 2 * 60 * 1000,
  '5m': 5 * 60 * 1000,
  '10m': 10 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '3h': 3 * 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '1mo': 30 * 24 * 60 * 60 * 1000,
};

function parseNumber(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw === 'string') {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseTimestampMs(raw: unknown): number | null {
  if (raw instanceof Date) {
    const ms = raw.getTime();
    return Number.isFinite(ms) ? ms : null;
  }

  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return null;
    if (raw > 1e11) return raw;
    if (raw > 1e9) return raw * 1000;
    return null;
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      if (numeric > 1e11) return numeric;
      if (numeric > 1e9) return numeric * 1000;
    }

    const parsed = Date.parse(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseHistoryPoint(entry: unknown): ParsedHistoryPoint | null {
  if (Array.isArray(entry)) {
    const [timeRaw, valueRaw] = entry;
    const timeMs = parseTimestampMs(timeRaw);
    const value = parseNumber(valueRaw);
    if (timeMs === null || value === null) return null;
    return { timeMs, value, source: entry };
  }

  if (entry && typeof entry === 'object') {
    const record = entry as Record<string, unknown>;
    const timeMs = parseTimestampMs(record.time ?? record.timestamp ?? record.ts ?? record.x);
    const value = parseNumber(record.value ?? record.y);
    if (timeMs === null || value === null) return null;
    return { timeMs, value, source: entry };
  }

  return null;
}

function writeHistoryPoint(source: unknown, timeMs: number, value: number): unknown {
  if (Array.isArray(source)) return [timeMs, value];

  if (source && typeof source === 'object') {
    const next: Record<string, unknown> = { ...(source as Record<string, unknown>), value };
    if ('ts' in next) next.ts = timeMs;
    else if ('timestamp' in next) next.timestamp = timeMs;
    else if ('time' in next) next.time = timeMs;
    else if ('x' in next) next.x = timeMs;
    else next.ts = timeMs;
    return next;
  }

  return { ts: timeMs, value };
}

function normalizeAggregateFunction(aggFunction: string): string {
  const normalized = aggFunction.trim().toUpperCase();
  if (normalized === 'AVG') return 'AVG';
  if (normalized === 'MAX') return 'MAX';
  if (normalized === 'MIN' || normalized === 'MIX') return 'MIN';
  if (normalized === 'SUM') return 'SUM';
  if (normalized === 'COUNT') return 'COUNT';
  if (normalized === 'NONE_RAW' || normalized === 'NO_AGGREGATE') return 'NONE_RAW';
  return normalized;
}

function aggregateValues(values: number[], aggFunction: string): number {
  const normalizedAggFunction = normalizeAggregateFunction(aggFunction);
  if (normalizedAggFunction === 'COUNT') return values.length;
  if (normalizedAggFunction === 'MIN') return Math.min(...values);
  if (normalizedAggFunction === 'MAX') return Math.max(...values);
  const sum = values.reduce((acc, value) => acc + value, 0);
  if (normalizedAggFunction === 'SUM') return sum;
  return sum / values.length;
}

function applyHistoryConfig(value: unknown, config: HistoryConfig | undefined): unknown {
  if (!config || !Array.isArray(value)) return value;

  const points = value
    .map(parseHistoryPoint)
    .filter((point): point is ParsedHistoryPoint => point !== null)
    .sort((a, b) => a.timeMs - b.timeMs);
  if (points.length === 0) return value;

  const timeRange = typeof config.timeRange === 'string' ? config.timeRange : '';
  const rangeMs = HISTORY_TIME_RANGE_MS[timeRange];
  const endMs = points[points.length - 1]!.timeMs;
  const rangeStartMs = rangeMs ? endMs - rangeMs : points[0]!.timeMs;
  const ranged = rangeMs ? points.filter((point) => point.timeMs >= rangeStartMs) : points;
  const visiblePoints = ranged.length > 0 ? ranged : [points[points.length - 1]!];

  const aggFunction =
    typeof config.aggFunction === 'string'
      ? normalizeAggregateFunction(config.aggFunction)
      : 'NONE_RAW';
  const aggWindow = typeof config.aggWindow === 'string' ? config.aggWindow : 'no_aggregate';
  const windowMs = HISTORY_AGG_WINDOW_MS[aggWindow];

  if (aggFunction === 'NONE_RAW' || !windowMs) {
    return visiblePoints.map((point) => point.source);
  }

  const buckets = new Map<number, ParsedHistoryPoint[]>();
  visiblePoints.forEach((point) => {
    const offsetMs =
      point.timeMs === rangeStartMs ? 0 : Math.max(0, point.timeMs - rangeStartMs - 1);
    const bucketStart = rangeStartMs + Math.floor(offsetMs / windowMs) * windowMs;
    const bucket = buckets.get(bucketStart);
    if (bucket) bucket.push(point);
    else buckets.set(bucketStart, [point]);
  });

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([bucketStart, bucket]) => {
      const values = bucket.map((point) => point.value);
      return writeHistoryPoint(
        bucket[bucket.length - 1]!.source,
        bucketStart,
        aggregateValues(values, aggFunction),
      );
    });
}

function applyHistoryConfigToSnapshot(
  snapshot: unknown,
  config: HistoryConfig | undefined,
): unknown {
  if (!config || !snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return snapshot;
  }

  let changed = false;
  const nextSnapshot: Record<string, unknown> = { ...(snapshot as Record<string, unknown>) };

  Object.entries(nextSnapshot).forEach(([key, value]) => {
    if (!key.endsWith('__history') || !Array.isArray(value)) return;
    const nextValue = applyHistoryConfig(value, config);
    if (nextValue !== value) {
      nextSnapshot[key] = nextValue;
      changed = true;
    }
  });

  return changed ? nextSnapshot : snapshot;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function resolveTemplateValues(value: unknown, context: Record<string, unknown>): unknown {
  if (typeof value === 'string') {
    return value.includes('{{') ? ExpressionEvaluator.evaluate(value, context) : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveTemplateValues(item, context));
  }

  if (isPlainObject(value)) {
    let changed = false;
    const next: Record<string, unknown> = {};
    Object.entries(value).forEach(([key, item]) => {
      const resolved = resolveTemplateValues(item, context);
      next[key] = resolved;
      if (resolved !== item) changed = true;
    });
    return changed ? next : value;
  }

  return value;
}

function cloneForPath(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneForPath);
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneForPath(item)]));
  }
  return value;
}

function setResolvedProp(target: Record<string, unknown>, path: string, value: unknown) {
  if (!path.includes('.')) {
    target[path] = value;
    return;
  }

  const segments = path.split('.').filter(Boolean);
  if (segments.length === 0) return;

  const rootKey = segments[0]!;
  const rootValue = cloneForPath(target[rootKey]);
  const nextRoot =
    rootValue !== undefined
      ? rootValue
      : /^\d+$/.test(segments[1] ?? '')
        ? []
        : {};

  let cursor: unknown = nextRoot;
  for (let idx = 1; idx < segments.length; idx += 1) {
    const segment = segments[idx]!;
    const isLast = idx === segments.length - 1;
    const nextSegment = segments[idx + 1];

    if (Array.isArray(cursor)) {
      const arrayIndex = Number(segment);
      if (!Number.isInteger(arrayIndex) || arrayIndex < 0) return;
      if (isLast) {
        cursor[arrayIndex] = value;
        break;
      }
      if (cursor[arrayIndex] === undefined || cursor[arrayIndex] === null) {
        cursor[arrayIndex] = /^\d+$/.test(nextSegment ?? '') ? [] : {};
      }
      cursor = cursor[arrayIndex];
      continue;
    }

    if (!isPlainObject(cursor)) return;

    if (isLast) {
      cursor[segment] = value;
      break;
    }

    if (cursor[segment] === undefined || cursor[segment] === null) {
      cursor[segment] = /^\d+$/.test(nextSegment ?? '') ? [] : {};
    }
    cursor = cursor[segment];
  }

  target[rootKey] = nextRoot;
}

/**
 * PropertyResolver: A utility to resolve dynamic property bindings in a node's props.
 * It follows the "React Bypass" philosophy by providing a way to get raw resolved props
 * for direct renderer updates.
 */
export class PropertyResolver {
  private static readonly FIELD_BINDING_EXPR_RE = /^\{\{\s*ds\.([^.\s}]+)\.data(?:\..+?)?\s*\}\}$/;

  private static buildExpressionDataSources(
    dataSources: Record<string, unknown>,
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};

    Object.entries(dataSources ?? {}).forEach(([dataSourceId, runtimeState]) => {
      if (!runtimeState || typeof runtimeState !== 'object') {
        resolved[dataSourceId] = runtimeState;
        return;
      }

      const runtimeStateObj = runtimeState as Record<string, unknown>;
      const entry: Record<string, unknown> = { ...runtimeStateObj };
      const rawData = runtimeStateObj.data;

      // Legacy compatibility:
      // some old templates bind with `{{ ds.myDs.temperature }}` instead of the
      // canonical `{{ ds.myDs.data.temperature }}`. Mirror plain object fields
      // onto the datasource object itself without overriding runtime metadata.
      if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
        Object.entries(rawData as Record<string, unknown>).forEach(([key, value]) => {
          if (!(key in entry)) {
            entry[key] = value;
          }
        });
      }

      resolved[dataSourceId] = entry;
    });

    return resolved;
  }

  private static resolveBindingDataSnapshot(
    binding: { dataSourcePath?: unknown; expression?: unknown },
    context: Record<string, unknown>,
  ): unknown {
    const explicitPath =
      typeof binding.dataSourcePath === 'string' ? binding.dataSourcePath.trim() : '';
    if (explicitPath) {
      return ExpressionEvaluator.evaluate(`{{ ${explicitPath} }}`, context);
    }

    const expression = typeof binding.expression === 'string' ? binding.expression.trim() : '';
    const match = this.FIELD_BINDING_EXPR_RE.exec(expression);
    if (!match?.[1]) return undefined;

    return ExpressionEvaluator.evaluate(`{{ ds.${match[1]}.data }}`, context);
  }

  /**
   * Resolves all properties of a node, including those with {{ ... }} expressions.
   * @param node The node state containing raw props and data bindings.
   * @param dataSources The global data source states from the kernel store.
   */
  public static resolve(
    node: NodeState,
    dataSources: Record<string, unknown>,
    variableValues?: Record<string, unknown>,
  ): Record<string, unknown> {
    const rawProps = (node.schemaRef.props ?? {}) as Record<string, unknown>;
    const resolvedProps: Record<string, unknown> = { ...rawProps };

    // Preparation: Context for expression evaluation
    const context = {
      ds: this.buildExpressionDataSources(dataSources),
      var: variableValues ?? {},
    };

    // 1. Resolve template strings inside props, including nested arrays used by 3D labels.
    Object.keys(resolvedProps).forEach((key) => {
      resolvedProps[key] = resolveTemplateValues(resolvedProps[key], context);
    });

    // 2. Resolve explicit DataBindings (from node.data)
    // node.data: DataBinding[]
    if (node.schemaRef.data && Array.isArray(node.schemaRef.data)) {
      node.schemaRef.data.forEach((binding: any) => {
        if (binding.targetProp && binding.expression) {
          const resolvedValue = ExpressionEvaluator.evaluate(binding.expression, context);
          // 只有当解析出结果时才覆盖
          if (resolvedValue !== undefined && resolvedValue !== null) {
            const historyResolvedValue = applyHistoryConfig(resolvedValue, binding.historyConfig);
            // Apply optional JS transform snippet.
            // Receives: `value` (the resolved field value), `data` (full DS snapshot for cross-field access)
            if (
              binding.transform &&
              typeof binding.transform === 'string' &&
              binding.transform.trim()
            ) {
              try {
                // Resolve full DS snapshot so transforms can access sibling fields
                // binding.dataSourcePath is like 'ds.myDs.data' — evaluate it from context
                const dsSnapshot = this.resolveBindingDataSnapshot(binding, context);
                // Use SafeExecutor sandbox (blocks window/document/fetch access)
                const result = SafeExecutor.executeScript(binding.transform.trim(), {
                  value: historyResolvedValue,
                  data: applyHistoryConfigToSnapshot(dsSnapshot, binding.historyConfig),
                });
                setResolvedProp(resolvedProps, binding.targetProp, result ?? historyResolvedValue);
              } catch {
                /* transform eval failed — use raw resolved value */
                setResolvedProp(resolvedProps, binding.targetProp, historyResolvedValue);
              }
            } else {
              setResolvedProp(resolvedProps, binding.targetProp, historyResolvedValue);
            }
          }
        }
      });
    }

    return resolvedProps;
  }
}
