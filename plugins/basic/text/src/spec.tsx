import { z } from 'zod';
import { type PluginMainModule } from '@thingsvis/schema';

/**
 * 文本组件属性定义
 * 分为：内容属性 (Props) 和 样式属性 (Style)
 */
const TextPropsSchema = z.object({
  // 1. 内容属性 (可被数据源覆盖)
  text: z.string().default('请输入文本').describe('文本内容'),
  
  // 2. 样式属性 (私有样式，建议放在 style 对象中或 props 中明确区分)
  fontSize: z.number().default(16).describe('字号'),
  fill: z.string().default('#000000').describe('文字颜色'),
  fontWeight: z.enum(['normal', 'bold']).default('normal').describe('字重'),
  textAlign: z.enum(['left', 'center', 'right']).default('left').describe('对齐'),
  fontFamily: z.string().default('sans-serif').describe('字体'),
});

export const entry: PluginMainModule = {
  id: 'basic-text',
  name: '基础文本',
  category: 'basic',
  icon: 'Type',
  version: '2.0.0',
  schema: TextPropsSchema,
};
