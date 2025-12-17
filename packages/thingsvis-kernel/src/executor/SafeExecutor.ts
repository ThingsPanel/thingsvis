export type SafeResult<T> = {
  ok: boolean;
  value?: T;
  error?: unknown;
};

/**
 * Execute arbitrary logic in a basic "sandbox" boundary.
 *
 * - Wraps execution in try/catch
 * - Logs errors to console for now (future: route to ErrorStore)
 * - Returns a safe fallback value when execution fails
 */
export function safeExecute<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (error) {
    // Minimal logging for now; can be replaced with ErrorStore later.
    // eslint-disable-next-line no-console
    console.error('[SafeExecutor] execution error:', error);
    return fallback;
  }
}

