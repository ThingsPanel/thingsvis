import { z } from 'zod';
import { WidgetCategorySchema } from './widget-category';

/**
 * Component registry (registry.json)
 *
 * 注意：这里仅定义"数据形状"，不包含任何实现逻辑。
 */

export const ComponentRegistryEntrySchema = z.object({
  remoteName: z.string().min(1),
  remoteEntryUrl: z.string().url(),
  localEntryUrl: z.string().url().optional(), // 插件开发服务的地址 (如 http://localhost:3104/remoteEntry.js)
  staticEntryUrl: z.string().optional(), // 宿主服务直接托管的静态编译地址 (如 /widgets/custom/cyber-clock/dist/remoteEntry.js)
  debugSource: z.enum(['remote', 'local', 'static']).default('remote').optional(), // 调试模式下优先使用的来源
  exposedModule: z.literal('./Main'),
  version: z.string().min(1),
  name: z.string().optional(),
  icon: z.string().optional(),
  i18n: z.record(z.string()).optional(),
  // --- 组件中心增强元数据 ---
  category: WidgetCategorySchema.optional(),
  description: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  thumbnailUrl: z.string().optional(),
  defaultSize: z
    .object({
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  constraints: z
    .object({
      minWidth: z.number().optional(),
      minHeight: z.number().optional(),
      maxWidth: z.number().optional(),
      maxHeight: z.number().optional(),
    })
    .optional(),
});

export const ComponentRegistrySchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string().optional(),
  components: z.record(z.string().min(1), ComponentRegistryEntrySchema),
});

export type ComponentRegistryEntry = z.infer<typeof ComponentRegistryEntrySchema>;
export type ComponentRegistry = z.infer<typeof ComponentRegistrySchema>;
