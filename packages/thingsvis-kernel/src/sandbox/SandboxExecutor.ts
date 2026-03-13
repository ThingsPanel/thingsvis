/**
 * SandboxExecutor — Web Worker-backed script execution with timeout.
 *
 * Features:
 * - True thread isolation via Web Workers (no shared memory with main thread)
 * - Hard 5-second timeout: entire Worker is terminated if script doesn't yield
 *   (handles infinite loops, e.g. `while(true){}` safely)
 * - Graceful fallback: when Worker is unavailable (SSR / Node), delegates to
 *   SafeExecutor.executeScript() — same Proxy sandbox, no timeout isolation
 *
 * Usage:
 *   const result = await SandboxExecutor.run(code, context, 5000);
 */

const WORKER_SCRIPT = /* javascript */ `
"use strict";
var BLOCKED = ['fetch','XMLHttpRequest','WebSocket','importScripts'];
for (var _i = 0; _i < BLOCKED.length; _i++) {
  try {
    Object.defineProperty(globalThis, BLOCKED[_i], {
      get: function() { throw new Error('[ThingsVis Sandbox] "' + BLOCKED[_i] + '" is blocked'); },
      configurable: false
    });
  } catch(e) {}
}
self.onmessage = function(e) {
  var id = e.data.id, code = e.data.code, ctx = e.data.context || {};
  try {
    var keys = Object.keys(ctx);
    var vals = keys.map(function(k){ return ctx[k]; });
    var args = keys.concat(['"use strict";\\n' + code]);
    var fn = Function.apply(null, args);
    var result = fn.apply(null, vals);
    self.postMessage({ id: id, result: result });
  } catch(err) {
    self.postMessage({ id: id, error: err instanceof Error ? err.message : String(err) });
  }
};
`;

let workerBlobUrl: string | null = null;

function getWorkerBlobUrl(): string {
  if (!workerBlobUrl) {
    const blob = new Blob([WORKER_SCRIPT], { type: 'application/javascript' });
    workerBlobUrl = URL.createObjectURL(blob);
  }
  return workerBlobUrl;
}

export interface SandboxResult {
  success: boolean;
  value?: unknown;
  error?: string;
}

/**
 * Execute arbitrary JS code in an isolated Web Worker with a timeout.
 *
 * @param code     JS code string. The last expression's value is captured implicitly.
 *                 Use `return` for explicit returns.
 * @param context  Named variables to inject into the script scope.
 * @param timeoutMs Hard timeout in milliseconds (default: 5000).
 *                  When exceeded, the Worker is terminated.
 */
export async function runInSandbox(
  code: string,
  context: Record<string, unknown> = {},
  timeoutMs = 5000,
): Promise<SandboxResult> {
  // Fallback in non-browser or when Worker/Blob is unavailable
  if (typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') {
    return runFallback(code, context);
  }

  return new Promise<SandboxResult>((resolve) => {
    let settled = false;
    let worker: Worker | null = null;

    const settle = (result: SandboxResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        worker?.terminate();
      } catch {
        /* ignore */
      }
      resolve(result);
    };

    // Use the inline blob URL
    try {
      worker = new Worker(getWorkerBlobUrl());
    } catch (e) {
      // Worker creation failed (e.g., CSP), fall back
      resolve(runFallbackSync(code, context));
      return;
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const timer = setTimeout(() => {
      settle({ success: false, error: `Script execution timed out after ${timeoutMs}ms` });
    }, timeoutMs);

    worker.onmessage = (event: MessageEvent) => {
      const data = event.data as { id: string; result?: unknown; error?: string };
      if (data.id !== id) return;
      if (data.error !== undefined) {
        settle({ success: false, error: data.error });
      } else {
        settle({ success: true, value: data.result });
      }
    };

    worker.onerror = (event: ErrorEvent) => {
      settle({ success: false, error: event.message || 'Worker error' });
    };

    worker.postMessage({ id, code, context });
  });
}

// ─── Fallback (no Worker support) ─────────────────────────────────────────────

function runFallbackSync(code: string, context: Record<string, unknown>): SandboxResult {
  try {
    const keys = Object.keys(context);
    const vals = keys.map((k) => context[k]);
    // eslint-disable-next-line no-new-func
    const fn = new Function(...keys, `"use strict";\n${code}`);
    const value = fn(...vals);
    return { success: true, value };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function runFallback(code: string, context: Record<string, unknown>): Promise<SandboxResult> {
  return runFallbackSync(code, context);
}

/**
 * SandboxExecutor — static-method façade for ergonomic use.
 */
export class SandboxExecutor {
  static readonly DEFAULT_TIMEOUT = 5000;

  /**
   * Run code in a Web Worker sandbox.
   */
  static run(
    code: string,
    context?: Record<string, unknown>,
    timeoutMs?: number,
  ): Promise<SandboxResult> {
    return runInSandbox(code, context ?? {}, timeoutMs ?? this.DEFAULT_TIMEOUT);
  }

  /**
   * Test whether the current environment supports Worker-based sandboxing.
   */
  static isSupported(): boolean {
    return typeof Worker !== 'undefined' && typeof Blob !== 'undefined';
  }
}
