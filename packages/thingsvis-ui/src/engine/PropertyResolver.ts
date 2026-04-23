import { type NodeState } from '@thingsvis/kernel';
import { SafeExecutor } from '@thingsvis/kernel';
import { ExpressionEvaluator } from '@thingsvis/utils';

/**
 * PropertyResolver: A utility to resolve dynamic property bindings in a node's props.
 * It follows the "React Bypass" philosophy by providing a way to get raw resolved props
 * for direct renderer updates.
 */
export class PropertyResolver {
  private static buildExpressionDataSources(
    dataSources: Record<string, unknown>,
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};

    Object.entries(dataSources ?? {}).forEach(([dataSourceId, runtimeState]) => {
      if (!runtimeState || typeof runtimeState !== 'object') {
        resolved[dataSourceId] = runtimeState;
        return;
      }

      const runtimeStateObj = runtimeState as Record<string, unknown>;
      const entry: Record<string, unknown> = { ...runtimeStateObj };
      const rawData = runtimeStateObj.data;

      // Legacy compatibility:
      // some old templates bind with `{{ ds.myDs.temperature }}` instead of the
      // canonical `{{ ds.myDs.data.temperature }}`. Mirror plain object fields
      // onto the datasource object itself without overriding runtime metadata.
      if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
        Object.entries(rawData as Record<string, unknown>).forEach(([key, value]) => {
          if (!(key in entry)) {
            entry[key] = value;
          }
        });
      }

      resolved[dataSourceId] = entry;
    });

    return resolved;
  }

  /**
   * Resolves all properties of a node, including those with {{ ... }} expressions.
   * @param node The node state containing raw props and data bindings.
   * @param dataSources The global data source states from the kernel store.
   */
  public static resolve(
    node: NodeState,
    dataSources: Record<string, unknown>,
    variableValues?: Record<string, unknown>,
  ): Record<string, unknown> {
    const rawProps = (node.schemaRef.props ?? {}) as Record<string, unknown>;
    const resolvedProps: Record<string, unknown> = { ...rawProps };

    // Preparation: Context for expression evaluation
    const context = {
      ds: this.buildExpressionDataSources(dataSources),
      var: variableValues ?? {},
    };

    // 1. Resolve standard property bindings (legacy/simple)
    Object.keys(resolvedProps).forEach((key) => {
      let val = resolvedProps[key];
      if (typeof val === 'string') {
        if (val.includes('{{')) {
          resolvedProps[key] = ExpressionEvaluator.evaluate(val, context);
        }
      }
    });

    // 2. Resolve explicit DataBindings (from node.data)
    // node.data: DataBinding[]
    if (node.schemaRef.data && Array.isArray(node.schemaRef.data)) {
      node.schemaRef.data.forEach((binding: any) => {
        if (binding.targetProp && binding.expression) {
          const resolvedValue = ExpressionEvaluator.evaluate(binding.expression, context);
          // 只有当解析出结果时才覆盖
          if (resolvedValue !== undefined && resolvedValue !== null) {
            // Apply optional JS transform snippet.
            // Receives: `value` (the resolved field value), `data` (full DS snapshot for cross-field access)
            if (
              binding.transform &&
              typeof binding.transform === 'string' &&
              binding.transform.trim()
            ) {
              try {
                // Resolve full DS snapshot so transforms can access sibling fields
                // binding.dataSourcePath is like 'ds.myDs.data' — evaluate it from context
                let dsSnapshot: unknown = undefined;
                if (binding.dataSourcePath && typeof binding.dataSourcePath === 'string') {
                  dsSnapshot = ExpressionEvaluator.evaluate(
                    `{{ ${binding.dataSourcePath} }}`,
                    context,
                  );
                }
                // Use SafeExecutor sandbox (blocks window/document/fetch access)
                const result = SafeExecutor.executeScript(binding.transform.trim(), {
                  value: resolvedValue,
                  data: dsSnapshot,
                });
                resolvedProps[binding.targetProp] = result ?? resolvedValue;
              } catch {
                /* transform eval failed — use raw resolved value */
                resolvedProps[binding.targetProp] = resolvedValue;
              }
            } else {
              resolvedProps[binding.targetProp] = resolvedValue;
            }
          }
        }
      });
    }

    return resolvedProps;
  }
}
