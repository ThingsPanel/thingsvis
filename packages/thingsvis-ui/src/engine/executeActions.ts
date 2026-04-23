/**
 * executeActions — action system implementation (formerly TASK-23)
 *
 * Executes a list of ActionConfigItems against the current kernel state.
 * This is wired into the `emit` function that widgets receive via WidgetOverlayContext.
 */
import type { DataSourceManager } from '@thingsvis/kernel';
import type { EventBus } from './EventBus';
import { SafeExecutor } from '@thingsvis/kernel';

export type ActionRuntime = {
  dataSourceManager?: Pick<DataSourceManager, 'writeDataSource'>;
};

export interface ActionConfigItem {
  type: 'setVariable' | 'callWrite' | 'navigate' | 'runScript';
  // setVariable
  variableName?: string;
  value?: unknown;
  // callWrite
  dataSourceId?: string;
  payload?: unknown;
  // navigate
  url?: string;
  target?: '_blank' | '_self' | '_top';
  // runScript
  script?: string;
}

function isAbsoluteUrl(url: string): boolean {
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url) || url.startsWith('//');
}

type ResolveNavigateEnv = {
  currentOrigin?: string;
  referrer?: string;
  isEmbedded?: boolean;
  target?: '_blank' | '_self' | '_top';
};

function resolveNavigateDestination(
  rawUrl: string,
  env: ResolveNavigateEnv = {},
): { url: string; target: '_blank' | '_self' | '_top' } {
  const url = rawUrl.trim();
  const currentOrigin = env.currentOrigin ?? '';
  const referrer = env.referrer ?? '';
  const isEmbedded = env.isEmbedded ?? false;

  if (!url) {
    return { url, target: env.target ?? '_blank' };
  }

  if (isAbsoluteUrl(url)) {
    return { url, target: env.target ?? '_blank' };
  }

  if (url.startsWith('/')) {
    let baseOrigin = currentOrigin;

    if (referrer) {
      try {
        baseOrigin = new URL(referrer).origin;
      } catch {
        // ignore invalid referrer and fall back to current origin
      }
    }

    const resolvedUrl = baseOrigin ? new URL(url, baseOrigin).toString() : url;
    return {
      url: resolvedUrl,
      target: env.target ?? (isEmbedded ? '_top' : '_self'),
    };
  }

  return { url, target: env.target ?? '_blank' };
}

// ── Template expression helpers ──────────────────────────────────────

/**
 * Build the standard expression context object used by both
 * `setVariable` and `callWrite` for SafeExecutor evaluation.
 */
function buildExpressionContext(
  state: Record<string, unknown>,
  payload: unknown,
): Record<string, unknown> {
  return {
    payload,
    vars: state.variableValues ?? {},
    ds: state.dataSources ?? {},
    Math,
    JSON,
    random: Math.random,
  };
}

/**
 * Resolve `{{expression}}` mustache-style templates inside a string.
 *
 * Each `{{...}}` segment is evaluated via SafeExecutor with the given context.
 * Non-string results are JSON-stringified so they can be embedded in a JSON string.
 *
 * Examples:
 *   `{{payload ? 'TurnOn' : 'TurnOff'}}`         → `"TurnOn"`
 *   `{"id": "{{payload ? 1 : 0}}"}`               → `{"id": "1"}`
 *   `{{payload}}`                                  → `true`
 */
function resolveTemplateExpressions(template: string, context: Record<string, unknown>): string {
  return template.replace(/\{\{(.+?)\}\}/gs, (_match, expr: string) => {
    const result = SafeExecutor.executeScript(expr.trim(), context);
    if (result === undefined || result === null) return '';
    return typeof result === 'string' ? result : JSON.stringify(result);
  });
}

/**
 * Resolve a payload value that may contain dynamic expressions.
 *
 * Resolution order:
 * 1. If string contains `{{...}}` — resolve mustache templates, then JSON.parse
 * 2. If plain string — try JSON.parse first (static JSON is the common case)
 * 3. If not valid JSON — try evaluating as a full JS expression via SafeExecutor
 * 4. Final fallback — return raw string
 */
function resolvePayload(raw: unknown, context: Record<string, unknown>): unknown {
  if (typeof raw !== 'string') return raw;

  const hasMustache = /\{\{.+?\}\}/s.test(raw);

  if (hasMustache) {
    const singleExpression = raw.match(/^\s*\{\{([\s\S]+?)\}\}\s*$/);
    if (singleExpression) {
      const evaluated = SafeExecutor.executeScript((singleExpression[1] ?? '').trim(), context);
      if (evaluated !== undefined && evaluated !== null) return evaluated;
      return '';
    }

    const resolved = resolveTemplateExpressions(raw, context);
    try {
      return JSON.parse(resolved);
    } catch {
      /* not JSON after resolution */
    }
    // If the entire string was a single {{expr}}, the resolved value might be
    // a primitive that doesn't JSON.parse — evaluate it directly
    const evaluated = SafeExecutor.executeScript(resolved, context);
    if (evaluated !== undefined && evaluated !== null) return evaluated;
    return resolved;
  }

  // No mustache — try static JSON first (most common case for callWrite payloads)
  try {
    return JSON.parse(raw);
  } catch {
    /* not valid JSON */
  }

  // Not JSON — try as full JS expression (e.g. `payload ? {...} : {...}`)
  const evaluated = SafeExecutor.executeScript(raw, context);
  if (evaluated !== undefined && evaluated !== null) return evaluated;

  return raw;
}

// Exported for testing
export {
  resolvePayload as _resolvePayload,
  resolveTemplateExpressions as _resolveTemplateExpressions,
};
export { buildExpressionContext as _buildExpressionContext };
export { resolveNavigateDestination as _resolveNavigateDestination };

export interface EventHandlerConfig {
  event: string;
  actions: ActionConfigItem[];
}

/**
 * Execute a single action against the kernel state.
 *
 * @param action  The action descriptor
 * @param state   The raw kernel state (typed as any for forward-compat with store slices)
 * @param payload The optional payload from the widget emit call
 */
export function executeAction(
  action: ActionConfigItem,
  state: Record<string, unknown>,
  payload?: unknown,
  runtime: ActionRuntime = {},
): void {
  switch (action.type) {
    case 'setVariable': {
      const name = action.variableName;
      if (!name) break;

      let resolvedValue: unknown = action.value;
      if (typeof resolvedValue === 'string') {
        const context = buildExpressionContext(state, payload);

        // Try executing it as a dynamic expression
        const evaluated = SafeExecutor.executeScript(resolvedValue, context);
        // If successful, use the evaluated value; otherwise fallback to basic string handling
        if (evaluated !== undefined && evaluated !== null) {
          resolvedValue = evaluated;
        } else if (resolvedValue.includes('{{payload}}')) {
          resolvedValue = resolvedValue.replace('{{payload}}', String(payload ?? ''));
        }
      }

      (state as Record<string, Function>).setVariableValue?.(name, resolvedValue);
      break;
    }

    case 'callWrite': {
      const rawDsId = action.dataSourceId;
      if (!rawDsId) break;

      const context = buildExpressionContext(state, payload);
      const resolvedDsId = resolvePayload(rawDsId, context);
      const dsId = typeof resolvedDsId === 'string' ? resolvedDsId.trim() : '';
      if (!dsId) {
        console.warn('[ThingsVis] callWrite skipped: dataSourceId did not resolve to a string', {
          dataSourceId: rawDsId,
          resolved: resolvedDsId,
        });
        break;
      }

      const dataSourceManager = runtime.dataSourceManager;
      if (!dataSourceManager) {
        console.warn(
          '[ThingsVis] callWrite skipped: no runtime-scoped dataSourceManager provided',
          {
            dataSourceId: dsId,
          },
        );
        break;
      }

      // Use configured payload if set, otherwise fall back to event payload
      const rawPayload = action.payload ?? payload;
      // Resolve dynamic expressions: {{expr}}, full JS expressions, or static JSON
      const writePayload = resolvePayload(rawPayload, context);
      if ((import.meta as any).env?.DEV) {
        console.debug('[ThingsVis] callWrite →', dsId, {
          raw: rawPayload,
          resolved: writePayload,
          resolvedType: typeof writePayload,
        });
      }
      dataSourceManager
        .writeDataSource(dsId, writePayload)
        .then((result) => {
          if (!result.success) {
            console.error('[ThingsVis] callWrite failed for dataSource', dsId, result.error);
          }
        })
        .catch((e) => {
          console.error('[ThingsVis] callWrite error for dataSource', dsId, e);
        });
      break;
    }

    case 'navigate': {
      const rawUrl = action.url;
      if (!rawUrl) break;
      const { url, target } = resolveNavigateDestination(rawUrl, {
        currentOrigin: typeof window !== 'undefined' ? window.location.origin : '',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        isEmbedded: typeof window !== 'undefined' ? window.top !== window : false,
        target: action.target,
      });
      try {
        window.open(url, target);
      } catch (e) {
        console.error('[ThingsVis] navigate failed', url, e);
      }
      break;
    }

    case 'runScript': {
      const script = action.script;
      if (!script) break;
      // Use SafeExecutor for sandboxed execution (blocks window/document/fetch).
      // The script receives `store` (kernel state) and `payload` as named variables.
      SafeExecutor.executeScript(script, { store: state, payload });
      break;
    }

    default:
      break;
  }
}

/**
 * Build an `emit` function for a specific node.
 * Called once per node and closed over `nodeSchemaGetter` + `state getter` so it
 * always reads the freshest schema at the moment of the call.
 *
 * @param getSchema  Thunk that returns the latest node schema (avoids stale closures)
 * @param getState   Thunk that returns the latest kernel state
 * @param bus        Optional EventBus — when provided, every emit() call also broadcasts
 *                   to all cross-widget subscribers registered via bus.on()
 */
export function buildEmit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSchema: () => any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getState: () => any,
  bus?: EventBus,
  runtime: ActionRuntime = {},
): (eventName: string, payload?: unknown) => void {
  return (eventName: string, payload?: unknown) => {
    const schema = getSchema();
    const handlers = (schema?.events ?? []) as EventHandlerConfig[];
    const matching = handlers.filter((h) => h.event === eventName);

    const state = getState();

    // 1. Execute configured actions for this node's event handlers
    if (matching.length > 0) {
      for (const handler of matching) {
        for (const action of handler.actions ?? []) {
          executeAction(action, state, payload, runtime);
        }
      }
    }

    // 2. Broadcast to EventBus for cross-widget listeners
    bus?.emit(eventName, payload);
  };
}
