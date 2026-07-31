/**
 * Simple expression evaluator for {{ path.to.data }} or {{ expression }} syntax.
 * Supports both simple path access and JavaScript expressions.
 */
export class ExpressionEvaluator {
  private static readonly BRACKET_SAFE_KEY_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

  /**
   * Host-provided data source ids may contain dashes. JavaScript parses
   * ds.__platform_abc-123__.data as subtraction, so normalize those root
   * context accesses before evaluating expressions.
   */
  private static normalizeContextAccessForJs(expr: string): string {
    let out = expr.replace(/\b(ds|var)\.([a-zA-Z0-9_-]+)/g, (_match, root: string, key: string) => {
      if (this.BRACKET_SAFE_KEY_RE.test(key)) {
        return `${root}.${key}`;
      }
      return `${root}[${JSON.stringify(key)}]`;
    });
    // Function 参数名不能使用保留字 var，求值前映射为 __tv_var
    out = out.replace(/\bvar\./g, '__tv_var.');
    out = out.replace(/\bvar\[/g, '__tv_var[');
    return out;
  }

  /**
   * Evaluates an expression against a context object.
   * @param expression The string containing {{ ... }}
   * @param context The object containing data sources (e.g., { ds: { weather: { data: 25 } } })
   */
  public static evaluate(expression: string, context: any): any {
    const regex = /\{\{(.+?)\}\}/g;

    // If the expression is EXACTLY {{ ... }}, evaluate and return the raw value
    const singleMatch = /^\{\{(.+?)\}\}$/.exec(expression.trim());
    const singleExpr = singleMatch?.[1];
    if (singleExpr !== undefined) {
      return this.evaluateExpression(singleExpr.trim(), context);
    }

    // Otherwise, treat as a template string and replace all matches
    return expression.replace(regex, (_, expr) => {
      const val = this.evaluateExpression(expr.trim(), context);
      return val === undefined || val === null ? '' : String(val);
    });
  }

  /**
   * 将纯路径表达式（点分 / 括号键 / []）解析为路径段；非纯路径返回 null。
   * 例如：ds.dev.data["A_3.Status_S"] → ["ds","dev","data","A_3.Status_S"]
   */
  private static tokenizePath(path: string): string[] | null {
    const segments: string[] = [];
    let i = 0;
    const s = path.trim();
    if (!s) return null;

    const readIdent = (): string | null => {
      // 后续段允许 `-`（平台数据源 id）
      const re = segments.length === 0
        ? /^[a-zA-Z_][a-zA-Z0-9_]*/
        : /^[a-zA-Z_][a-zA-Z0-9_-]*/;
      const m = re.exec(s.slice(i));
      if (!m) return null;
      i += m[0].length;
      return m[0];
    };

    // 首段必须是标识符
    const first = readIdent();
    if (!first) return null;
    let seg = first;
    if (s.startsWith('[]', i)) {
      seg += '[]';
      i += 2;
    }
    segments.push(seg);

    while (i < s.length) {
      if (s[i] === '.') {
        i += 1;
        if (s.startsWith('[]', i)) {
          segments.push('[]');
          i += 2;
          continue;
        }
        const ident = readIdent();
        if (!ident) return null;
        let next = ident;
        if (s.startsWith('[]', i)) {
          next += '[]';
          i += 2;
        }
        segments.push(next);
        continue;
      }

      if (s[i] === '[') {
        if (s.startsWith('[]', i)) {
          segments.push('[]');
          i += 2;
          continue;
        }
        const dq = /^\["((?:\\.|[^"\\])*)"\]/.exec(s.slice(i));
        if (dq?.[1] !== undefined) {
          try {
            segments.push(JSON.parse(`"${dq[1]}"`) as string);
          } catch {
            return null;
          }
          i += dq[0].length;
          continue;
        }
        const sq = /^\['((?:\\.|[^'\\])*)'\]/.exec(s.slice(i));
        if (sq?.[1] !== undefined) {
          segments.push(sq[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\'));
          i += sq[0].length;
          continue;
        }
        return null;
      }

      return null;
    }

    return segments;
  }

  /**
   * Evaluates a JavaScript expression with the given context.
   * Falls back to simple path access for compatibility.
   */
  private static evaluateExpression(expr: string, context: any): any {
    // 纯路径（含括号键 / []）优先走最长匹配 get，避免进入 JS（且避开 var 保留字问题）
    const pathSegments = this.tokenizePath(expr);
    if (pathSegments) {
      return this.getFromSegments(context, pathSegments);
    }

    // Otherwise, evaluate as a JavaScript expression
    try {
      const sandbox: Record<string, any> = {
        ...context,
        Math,
        JSON,
        String,
        Number,
        Boolean,
        Array,
        Object,
        Date,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
      };

      const keys = Object.keys(sandbox);
      const values = keys.map((k) => sandbox[k]);
      // 保留字 var 不能作为 Function 形参名
      const paramNames = keys.map((k) => (k === 'var' ? '__tv_var' : k));

      const safeExpr = this.normalizeContextAccessForJs(expr);
      const fn = new Function(...paramNames, `return (${safeExpr})`);
      return fn(...values);
    } catch (error) {
      // Fallback: try simple path access
      const fallback = this.tokenizePath(expr);
      if (fallback) return this.getFromSegments(context, fallback);
      return undefined;
    }
  }

  private static hasOwnKey(obj: object, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  /**
   * 从当前位置对剩余路径段做从长到短的候选键匹配。
   * 优先命中扁平整键（如 A_3.Status_S），否则退回单段再继续。
   */
  private static matchLongestKey(
    acc: Record<string, unknown>,
    parts: string[],
    start: number,
  ): { key: string; consumed: number } | null {
    for (let end = parts.length - 1; end >= start; end--) {
      const candidateParts = parts.slice(start, end + 1);
      // 候选键不能跨越 [] / key[] 段
      if (candidateParts.some((p) => p === '[]' || p.endsWith('[]'))) {
        continue;
      }
      const candidate = candidateParts.join('.');
      if (this.hasOwnKey(acc, candidate)) {
        return { key: candidate, consumed: end - start + 1 };
      }
    }
    return null;
  }

  /**
   * Simple deep-get helper (similar to lodash.get).
   * Supports [] as "first element of array" and key[] as "property then first element".
   * e.g. "ds.myDs.data.[].value" or "ds.myDs.data.items[].name"
   *
   * 含点扁平键：对剩余路径段从长到短匹配，优先整键（如 A_3.Status_S），
   * 再退回单段嵌套；若同时存在扁平键 a.b 与嵌套 a.b，优先扁平整键。
   */
  private static get(obj: any, path: string): any {
    const parts = path.split('.');
    return this.getFromSegments(obj, parts);
  }

  private static getFromSegments(obj: any, parts: string[]): any {
    let acc: any = obj;
    let i = 0;

    while (i < parts.length) {
      if (acc == null) return undefined;

      const part = parts[i]!;

      // [] alone: treat acc itself as array, return first element
      if (part === '[]') {
        acc = Array.isArray(acc) ? acc[0] : undefined;
        i += 1;
        continue;
      }

      // key[] syntax: access property then return first element of resulting array
      if (part.endsWith('[]')) {
        const key = part.slice(0, -2);
        if (acc !== null && typeof acc === 'object' && !Array.isArray(acc)) {
          const arr = (acc as Record<string, unknown>)[key];
          acc = Array.isArray(arr) ? arr[0] : undefined;
        } else {
          acc = undefined;
        }
        i += 1;
        continue;
      }

      if (Array.isArray(acc)) {
        acc = (acc as any)[part];
        i += 1;
        continue;
      }

      if (typeof acc === 'object') {
        // 单段已是完整键（含点的扁平键经 tokenize 后为一段）时直接取
        if (this.hasOwnKey(acc, part)) {
          // 仍做最长匹配：后续段可能与 part 拼成更长整键
          const matched = this.matchLongestKey(acc as Record<string, unknown>, parts, i);
          if (!matched) return undefined;
          acc = (acc as Record<string, unknown>)[matched.key];
          i += matched.consumed;
          continue;
        }
        const matched = this.matchLongestKey(acc as Record<string, unknown>, parts, i);
        if (!matched) return undefined;
        acc = (acc as Record<string, unknown>)[matched.key];
        i += matched.consumed;
        continue;
      }

      return undefined;
    }

    return acc;
  }
}
