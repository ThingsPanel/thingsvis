/**
 * Simple expression evaluator for {{ path.to.data }} syntax.
 */
export class ExpressionEvaluator {
  /**
   * Evaluates an expression against a context object.
   * @param expression The string containing {{ ... }}
   * @param context The object containing data sources (e.g., { ds: { weather: { data: 25 } } })
   */
  public static evaluate(expression: string, context: any): any {
    const regex = /\{\{(.+?)\}\}/g;
    
    // If the expression is EXACTLY {{ path }}, return the raw value (could be an object/array)
    const singleMatch = /^\{\{(.+?)\}\}$/.exec(expression.trim());
    if (singleMatch) {
      return this.get(context, singleMatch[1].trim());
    }

    // Otherwise, treat as a template string and replace all matches
    return expression.replace(regex, (_, path) => {
      const val = this.get(context, path.trim());
      return val === undefined || val === null ? '' : String(val);
    });
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

