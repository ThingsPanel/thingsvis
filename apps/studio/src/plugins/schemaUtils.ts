import type { PluginMainModule } from '@thingsvis/schema';

/**
 * 从插件 Schema 中提取 props 默认值
 * - 如果 schema 未提供或没有 default，则返回空对象
 */
export function extractDefaults(schema: PluginMainModule['schema']): Record<string, unknown> {
  if (!schema?.props) return {};
  const defaults: Record<string, unknown> = {};
  for (const [key, meta] of Object.entries(schema.props)) {
    if (meta && Object.prototype.hasOwnProperty.call(meta, 'default')) {
      defaults[key] = meta.default;
    }
  }
  return defaults;
}

