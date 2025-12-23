import { z } from 'zod';

/**
 * Component registry (registry.json)
 *
 * 注意：这里仅定义“数据形状”，不包含任何实现逻辑。
 */

export const ComponentRegistryEntrySchema = z.object({
  remoteName: z.string().min(1),
  remoteEntryUrl: z.string().url(),
  localEntryUrl: z.string().url().optional(), // 插件开发服务的地址 (如 http://localhost:3104/remoteEntry.js)
  staticEntryUrl: z.string().optional(), // 宿主服务直接托管的静态编译地址 (如 /plugins/custom/cyber-clock/dist/remoteEntry.js)
  debugSource: z.enum(['remote', 'local', 'static']).default('remote').optional(), // 调试模式下优先使用的来源
  exposedModule: z.literal('./Main'),
  version: z.string().min(1)
});

export const ComponentRegistrySchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string().optional(),
  components: z.record(z.string().min(1), ComponentRegistryEntrySchema)
});

export type ComponentRegistryEntry = z.infer<typeof ComponentRegistryEntrySchema>;
export type ComponentRegistry = z.infer<typeof ComponentRegistrySchema>;


