/**
 * Simple expression evaluator for {{ path.to.data }} or {{ expression }} syntax.
 * Supports both simple path access and JavaScript expressions.
 */
export class ExpressionEvaluator {
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
   * Evaluates a JavaScript expression with the given context.
   * Falls back to simple path access for compatibility.
   */
  private static evaluateExpression(expr: string, context: any): any {
    // First, try simple path access (for backward compatibility and performance)
    // Simple path: only contains letters, numbers, dots, and underscores
    if (/^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/.test(expr)) {
      return this.get(context, expr);
    }

    // Otherwise, evaluate as a JavaScript expression
    try {
      // Create a safe sandbox with the context variables
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

      // Build the function with context variables as parameters
      const keys = Object.keys(sandbox);
      const values = keys.map(k => sandbox[k]);
      
      // Use Function constructor to evaluate the expression
      const fn = new Function(...keys, `return (${expr})`);
      return fn(...values);
    } catch (error) {
      console.warn('[ExpressionEvaluator] Failed to evaluate expression:', expr, error);
      // Fallback: try simple path access
      return this.get(context, expr);
    }
  }

  /**
   * Simple deep-get helper (similar to lodash.get)
   */
  private static get(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => {
      return acc && acc[part] !== undefined ? acc[part] : undefined;
    }, obj);
  }
}

