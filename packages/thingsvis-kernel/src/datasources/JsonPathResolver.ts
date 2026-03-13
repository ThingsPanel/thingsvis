/**
 * JsonPathResolver — lightweight JSONPath executor (no dependencies)
 *
 * Supported syntax subset:
 *   $                 — root value
 *   $.foo             — property access
 *   $.foo.bar         — nested property
 *   $.arr[0]          — index access
 *   $.arr[-1]         — last element
 *   $.arr[*]          — all elements (spreads to array)
 *   $.arr[*].name     — property on each element
 *   $.arr[0].foo.bar  — combined access
 *   $..name           — recursive descent (finds `name` at any depth)
 *
 * Returns the resolved value, or `undefined` when path does not match.
 */
export class JsonPathResolver {
  /**
   * Resolve a JSONPath expression against a root value.
   *
   * @param path   JSONPath string (must start with `$`)
   * @param root   Any JSON-compatible value
   * @returns      Resolved value, or `undefined` if the path does not match
   */
  static resolve(path: string, root: unknown): unknown {
    if (!path.startsWith('$')) {
      throw new Error(`[JsonPathResolver] Path must start with "$", got: ${path}`);
    }
    const tokens = JsonPathResolver.tokenize(path);
    return JsonPathResolver.evaluate(tokens, root);
  }

  /** Tokenize a JSONPath string into step tokens. */
  private static tokenize(path: string): Token[] {
    const tokens: Token[] = [];
    // Replace bracket notation with dot notation where possible
    // e.g. $['foo'] → $.foo, $[0] → step, $[*] → wildcard
    let i = 1; // skip '$'
    while (i < path.length) {
      if (path[i] === '.') {
        i++;
        if (path[i] === '.') {
          // recursive descent
          i++;
          const start = i;
          while (i < path.length && path[i] !== '.' && path[i] !== '[') i++;
          tokens.push({ type: 'recursive', key: path.slice(start, i) });
        } else {
          const start = i;
          while (i < path.length && path[i] !== '.' && path[i] !== '[') i++;
          const key = path.slice(start, i);
          if (key) tokens.push({ type: 'key', key });
        }
      } else if (path[i] === '[') {
        i++;
        const start = i;
        while (i < path.length && path[i] !== ']') i++;
        const inner = path.slice(start, i);
        i++; // skip ']'
        if (inner === '*') {
          tokens.push({ type: 'wildcard' });
        } else if (inner.startsWith("'") || inner.startsWith('"')) {
          tokens.push({ type: 'key', key: inner.slice(1, -1) });
        } else {
          const idx = parseInt(inner, 10);
          if (!isNaN(idx)) {
            tokens.push({ type: 'index', index: idx });
          }
        }
      } else {
        // bare characters at root level (shouldn't happen in valid paths)
        break;
      }
    }
    return tokens;
  }

  /** Evaluate token list against a value, handling wildcards/recursive. */
  private static evaluate(tokens: Token[], current: unknown): unknown {
    let values: unknown[] = [current];

    for (const token of tokens) {
      const next: unknown[] = [];

      if (token.type === 'key') {
        for (const v of values) {
          if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
            const picked = (v as Record<string, unknown>)[token.key];
            if (picked !== undefined) next.push(picked);
          }
        }
      } else if (token.type === 'index') {
        for (const v of values) {
          if (Array.isArray(v)) {
            const idx = token.index < 0 ? v.length + token.index : token.index;
            if (idx >= 0 && idx < v.length) next.push(v[idx]);
          }
        }
      } else if (token.type === 'wildcard') {
        for (const v of values) {
          if (Array.isArray(v)) {
            next.push(...v);
          } else if (v !== null && typeof v === 'object') {
            next.push(...Object.values(v as object));
          }
        }
      } else if (token.type === 'recursive') {
        for (const v of values) {
          next.push(...JsonPathResolver.descend(v, token.key));
        }
      }

      values = next;
    }

    // Unwrap single-element arrays from non-wildcard paths
    return values.length === 0 ? undefined : values.length === 1 ? values[0] : values;
  }

  /** Recursive descent: collect all `key` values at any depth. */
  private static descend(value: unknown, key: string): unknown[] {
    const results: unknown[] = [];
    if (value === null || typeof value !== 'object') return results;

    if (Array.isArray(value)) {
      for (const item of value) {
        results.push(...JsonPathResolver.descend(item, key));
      }
    } else {
      const obj = value as Record<string, unknown>;
      if (key in obj) results.push(obj[key]);
      for (const child of Object.values(obj)) {
        results.push(...JsonPathResolver.descend(child, key));
      }
    }
    return results;
  }

  /**
   * Apply the aggregate function to a resolved value.
   * If the value is already a scalar, aggregation is a no-op (except `none`).
   */
  static aggregate(value: unknown, method: 'last' | 'first' | 'sum' | 'avg' | 'none'): unknown {
    if (!Array.isArray(value)) return value; // scalar pass-through

    if (value.length === 0) return undefined;

    switch (method) {
      case 'first':
        return value[0];
      case 'last':
        return value[value.length - 1];
      case 'sum': {
        const nums = value.filter((v) => typeof v === 'number') as number[];
        return nums.reduce((a, b) => a + b, 0);
      }
      case 'avg': {
        const nums = value.filter((v) => typeof v === 'number') as number[];
        return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : undefined;
      }
      case 'none':
      default:
        return value;
    }
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Token =
  | { type: 'key'; key: string }
  | { type: 'index'; index: number }
  | { type: 'wildcard' }
  | { type: 'recursive'; key: string };
