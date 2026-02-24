import type { WidgetMainModule } from '@thingsvis/schema';

/**
 * 从插件 Schema 中提取 props 默认值
 * - 支持旧版的 PluginSchema 对象
 * - 支持新版的 Zod Schema 对象
 */
export function extractDefaults(schema: any): Record<string, unknown> {
  if (!schema) return {};

  // 1. 如果是 Zod Schema (具有 _def 属性)
  if (schema._def && typeof schema.parse === 'function') {
    try {
      // 通过解析空对象或默认值来获取
      return schema.parse({});
    } catch (e) {
      // 如果解析失败（因为有必填项），尝试从 _def 提取
      const shape = schema._def.shape?.() || {};
      const defaults: Record<string, any> = {};
      Object.keys(shape).forEach(key => {
        const field = shape[key];
        if (field._def.defaultValue) {
          defaults[key] = field._def.defaultValue();
        }
      });
      return defaults;
    }
  }

  // 2. 如果是旧版 PluginSchema 对象 { props: { ... } }
  if (schema.props) {
    const defaults: Record<string, unknown> = {};
    for (const [key, meta] of Object.entries(schema.props as Record<string, any>)) {
      if (meta && Object.prototype.hasOwnProperty.call(meta, 'default')) {
        defaults[key] = meta.default;
      }
    }
    return defaults;
  }

  return {};
}

