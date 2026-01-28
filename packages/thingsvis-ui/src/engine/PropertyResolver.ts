import { type NodeState } from '@thingsvis/kernel';
import { ExpressionEvaluator } from '@thingsvis/utils';
import { PlatformDataStore } from './PlatformDataStore';

/**
 * PropertyResolver: A utility to resolve dynamic property bindings in a node's props.
 * It follows the "React Bypass" philosophy by providing a way to get raw resolved props
 * for direct renderer updates.
 */
export class PropertyResolver {
  /**
   * Resolves all properties of a node, including those with {{ ... }} expressions.
   * @param node The node state containing raw props and data bindings.
   * @param dataSources The global data source states from the kernel store.
   * @param platformData Optional platform field data for {{ platform.xxx }} expressions.
   *                     If not provided, will fetch from PlatformDataStore.
   */
  public static resolve(
    node: NodeState,
    dataSources: Record<string, any>,
    platformData?: Record<string, any>
  ): Record<string, any> {
    const rawProps = (node.schemaRef.props ?? {}) as Record<string, any>;
    const resolvedProps: Record<string, any> = { ...rawProps };

    // Preparation: Context for expression evaluation
    // Include both data sources (ds) and platform fields (platform)
    const context = {
      ds: dataSources,
      platform: platformData ?? PlatformDataStore.getAll()
    };

    // 1. Resolve standard property bindings (legacy/simple)
    Object.keys(resolvedProps).forEach(key => {
      const val = resolvedProps[key];
      if (typeof val === 'string' && val.includes('{{')) {
        resolvedProps[key] = ExpressionEvaluator.evaluate(val, context);
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
            resolvedProps[binding.targetProp] = resolvedValue;
          }
        }
      });
    }

    return resolvedProps;
  }
}

