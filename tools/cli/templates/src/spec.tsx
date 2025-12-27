import { z } from 'zod';
import { type PluginMainModule } from '@thingsvis/schema';

/**
 * 组件属性定义
 */
const PropsSchema = z.object({
  // 定义你的属性，例如:
  // content: z.string().describe('内容'),
});

export const entry: PluginMainModule = {
  id: '{{componentId}}',
  name: '{{componentName}}',
  category: 'custom',
  icon: 'Box',
  version: '1.0.0',
  schema: PropsSchema,
};
