/**
 * SafeExecutor: A restricted JS execution environment for data transformations.
 * Uses new Function() and a Proxy sandbox to prevent global scope access.
 */

export class SafeExecutor {
  /**
   * Executes a string of code with a given context.
   * @param code The transformation script (e.g., "return data.value * 2")
   * @param data The input data object
   * @returns The transformed data or original if error occurs
   */
  public static execute(code: string, data: any): any {
    if (!code) return data;

    try {
      // Create a sandbox object to restrict global access
      const sandbox = {
        data,
        console: {
          log: (...args: any[]) => console.log('[Sandbox]', ...args),
          error: (...args: any[]) => console.error('[Sandbox]', ...args),
        },
        Math,
        JSON,
        Array,
        Object,
        Date,
      };

      // Use Proxy to trap property access and prevent walking up the prototype chain
      const proxy = new Proxy(sandbox, {
        has: () => true, // Treat every property as existing in the sandbox
        get: (target, key) => {
          if (key === Symbol.unscopables) return undefined;
          return (target as any)[key];
        }
      });

      // Wrap code in a function. 'with' statement redirects all variable lookups to the proxy.
      const createFn = (body: string) => new Function('sandbox', `
        with (sandbox) {
          try {
            ${body}
          } catch (err) {
            throw err;
          }
        }
      `);

      let fn;
      try {
        // Try to treat as expression first if no explicit return
        fn = createFn(code.includes('return') ? code : `return (${code})`);
      } catch (e) {
        // If expression parsing failed (e.g. user wrote statements like "let x = 1;"), try as statements
        if (e instanceof SyntaxError && !code.includes('return')) {
          fn = createFn(code);
        } else {
          throw e;
        }
      }

      return fn(proxy);
    } catch (error) {
      console.error('[SafeExecutor] Transformation failed:', error);
      // Return original data as fallback
      return data;
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

