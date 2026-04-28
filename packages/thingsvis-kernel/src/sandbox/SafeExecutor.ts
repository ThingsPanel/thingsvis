/**
 * SafeExecutor: A restricted JS execution environment for data transformations.
 * Uses new Function() and a Proxy sandbox to prevent global scope access.
 *
 * NOTE: Synchronous new Function() cannot be externally aborted.
 * The timing check below detects "slow but finishing" expressions;
 * true infinite-loop protection requires a Web Worker migration (future task).
 */

const EXEC_WARN_MS = 5_000;

type Mapping = Record<string | number, unknown>;

export const transformationUtils = Object.freeze({
  formatTime(value: unknown, format = 'YYYY-MM-DD HH:mm:ss'): string {
    const date =
      value instanceof Date
        ? value
        : typeof value === 'number' || typeof value === 'string'
          ? new Date(value)
          : null;

    if (!date || Number.isNaN(date.getTime())) return '';

    const pad = (input: number, length = 2) => String(input).padStart(length, '0');
    const tokens: Record<string, string> = {
      YYYY: String(date.getFullYear()),
      MM: pad(date.getMonth() + 1),
      DD: pad(date.getDate()),
      HH: pad(date.getHours()),
      mm: pad(date.getMinutes()),
      ss: pad(date.getSeconds()),
      SSS: pad(date.getMilliseconds(), 3),
    };

    return format.replace(/YYYY|MM|DD|HH|mm|ss|SSS/g, (token) => tokens[token] ?? token);
  },

  toFixed(value: unknown, decimals = 2): unknown {
    const numericValue = typeof value === 'number' ? value : Number(value);
    const precision = Number.isFinite(decimals) ? Math.max(0, Math.trunc(decimals)) : 2;

    return Number.isFinite(numericValue) ? numericValue.toFixed(precision) : value;
  },

  map(value: unknown, mapping: Mapping): unknown {
    if (!mapping || typeof mapping !== 'object') return value;

    const key = String(value);
    return Object.prototype.hasOwnProperty.call(mapping, key) ? mapping[key] : value;
  },
});

export class SafeExecutor {
  /**
   * Executes a string of code with a given context.
   * @param code The transformation script (e.g., "return data.value * 2")
   * @param data The input data object
   * @returns The transformed data or original if error occurs
   */
  public static execute(code: string, data: unknown): unknown {
    if (!code) return data;

    try {
      // Create a sandbox object to restrict global access.
      const sandbox = {
        data,
        console: {
          log: (...args: unknown[]) => {},
          error: (...args: unknown[]) => {},
        },
        Math,
        JSON,
        Array,
        Object,
        Date,
        String,
        Number,
        Boolean,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        utils: transformationUtils,
      };

      return SafeExecutor._runInSandbox(code, sandbox);
    } catch (error) {
      console.error('[SafeExecutor] execute() error:', error);
      return data;
    }
  }

  /**
   * Executes a user script with a named context object.
   * Each key in `context` becomes a directly-accessible variable in the script's scope.
   *
   * Used for RunScriptAction — the script can access `store.setVariableValue(...)`,
   * `payload`, `Math`, `JSON`, etc., but NOT `window`, `document`, or `fetch`.
   *
   * @param code    User-authored JS script (function body, not an expression)
   * @param context Named variables to expose: { store, payload, ... }
   * @returns       The return value of the script, or undefined on error
   */
  public static executeScript(code: string, context: Record<string, unknown>): unknown {
    if (!code) return undefined;
    try {
      const sandbox: Record<string, unknown> = {
        ...context,
        console: {
          log: (...args: unknown[]) => console.log('[Script]', ...args),
          error: (...args: unknown[]) => console.error('[Script]', ...args),
          warn: (...args: unknown[]) => console.warn('[Script]', ...args),
        },
        Math,
        JSON,
        Array,
        Object,
        Date,
        String,
        Number,
        Boolean,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        setTimeout: undefined, // blocked — scripts must remain synchronous
        setInterval: undefined,
        fetch: undefined,
        XMLHttpRequest: undefined,
        utils: transformationUtils,
      };

      return SafeExecutor._runInSandbox(code, sandbox);
    } catch (error) {
      console.error('[SafeExecutor] runScript error:', error);
      return undefined;
    }
  }

  /**
   * Core sandbox execution: wraps code in `with (proxy) { ... }` to redirect
   * all variable lookups, blocking access to the real global scope.
   */
  private static _runInSandbox(code: string, sandbox: Record<string, unknown>): unknown {
    const proxy = new Proxy(sandbox, {
      has: () => true, // Treat every property as existing in the sandbox
      get: (target, key) => {
        if (key === Symbol.unscopables) return undefined;
        return target[key as string];
      },
    });

    const fn = SafeExecutor._compileFn(code);

    const start = performance.now();
    const result = fn(proxy);
    const elapsed = performance.now() - start;
    if (elapsed > EXEC_WARN_MS) {
      console.warn(
        `[SafeExecutor] Expression took ${Math.round(elapsed)}ms, exceeding ${EXEC_WARN_MS}ms threshold`,
      );
    }
    return result;
  }

  /**
   * Compile user code into a sandboxed Function, attempting expression-first
   * then falling back to statement mode.
   */
  private static _compileFn(code: string): (sandbox: unknown) => unknown {
    const createFn = (body: string) =>
      new Function(
        'sandbox',
        `
      with (sandbox) {
        try {
          ${body}
        } catch (err) {
          throw err;
        }
      }
    `,
      ) as (sandbox: unknown) => unknown;

    try {
      return createFn(code.includes('return') ? code : `return (${code})`);
    } catch (e) {
      if (e instanceof SyntaxError && !code.includes('return')) {
        return createFn(code);
      }
      throw e;
    }
  }

  /**
   * Validates if the provided string is a valid JS expression/function body.
   */
  public static validate(code: string): boolean {
    try {
      new Function(code);
      return true;
    } catch {
      return false;
    }
  }
}
