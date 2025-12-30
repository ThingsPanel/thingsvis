import { z } from 'zod';

/**
 * Plugin Entry Type (inline definition for plugin independence)
 * 插件入口类型（内联定义，保证插件独立性）
 * 
 * NOTE: Plugins MUST NOT import from @thingsvis/* packages.
 * This type mirrors the host's expectation but is self-contained.
 * 注意：插件禁止从 @thingsvis/* 包导入任何内容。
 * 此类型与宿主期望的结构一致，但完全自包含。
 */
type PluginEntry = {
  id: string;
  name?: string;
  category?: string;
  icon?: string;
  version?: string;
  schema?: z.ZodType<any>;
  controls?: {
    groups: Array<{
      id: string;
      label?: string;
      fields: Array<{
        path: string;
        label: string;
        kind: 'string' | 'number' | 'boolean' | 'color' | 'select' | 'json';
        options?: Array<{ label: string; value: string | number }>;
        default?: unknown;
        binding?: {
          enabled: boolean;
          modes: Array<'static' | 'field' | 'expr' | 'rule'>;
        };
      }>;
    }>;
  };
};

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

export const entry: PluginEntry = {
  id: 'basic-text',
  name: '基础文本',
  category: 'basic',
  icon: 'Type',
  version: '2.0.0',
  schema: TextPropsSchema,
  controls: {
    groups: [
      {
        id: 'Content',
        label: '内容',
        fields: [
          {
            path: 'text',
            label: '文本内容',
            kind: 'string',
            binding: { enabled: true, modes: ['static', 'field', 'expr'] }
          }
        ]
      },
      {
        id: 'Style',
        label: '样式',
        fields: [
          {
            path: 'fill',
            label: '文字颜色',
            kind: 'color',
            binding: { enabled: true, modes: ['static', 'field', 'expr'] }
          },
          {
            path: 'fontSize',
            label: '字号',
            kind: 'number',
            binding: { enabled: true, modes: ['static', 'field', 'expr'] }
          }
        ]
      }
    ]
  }
};
