/**
 * ThingsVis Sandbox Worker Script (worker.ts)
 *
 * This script runs inside a Web Worker.
 * Protocol:
 *   FROM main: { id: string; code: string; context: Record<string, unknown> }
 *   TO   main: { id: string; result?: unknown; error?: string }
 *
 * The worker executes user code with a context proxy.
 * Dangerous globals (fetch, XMLHttpRequest, WebSocket) are explicitly undefined.
 *
 * NOTE: setTimeout/setInterval are available in workers but we intentionally
 * leave them accessible since infinite-loop detection is handled by terminate().
 */

// Block dangerous APIs that should not be accessible in user scripts
const BLOCKED_GLOBALS: string[] = ['fetch', 'XMLHttpRequest', 'WebSocket', 'importScripts', 'eval'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _global = globalThis as Record<string, any>;

for (const key of BLOCKED_GLOBALS) {
  try {
    Object.defineProperty(_global, key, {
      get: () => {
        throw new Error(`[ThingsVis Sandbox] Access to "${key}" is not allowed in scripts`);
      },
      configurable: false,
    });
  } catch {
    // Some environments won't allow redefining certain globals — skip silently
  }
}

_global.onmessage = function (event: MessageEvent) {
  const { id, code, context } = event.data as {
    id: string;
    code: string;
    context: Record<string, unknown>;
  };

  if (!id || typeof code !== 'string') {
    return; // invalid message, ignore
  }

  try {
    // Build a function with named context variables bound as parameters
    const contextKeys = Object.keys(context);
    const contextValues = contextKeys.map((k) => context[k]);

    // eslint-disable-next-line no-new-func
    const fn = new Function(...contextKeys, `"use strict";\n${code}`);
    const result = fn(...contextValues);

    _global.postMessage({ id, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    _global.postMessage({ id, error: message });
  }
};
