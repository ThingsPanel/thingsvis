import { z } from 'zod';
import { SAMPLE_LIST_ITEMS_JSON } from './sample-data';

/** JSON：`[{ icon, left, right }]`，字段可用 leftText/rightText、label/value 等别名；`icon` 可为文字或图片 URL。 */

export const PropsSchema = z.object({
  /** JSON 数组字符串；每项含 icon / left / right（可选用别名）；数据源可绑定数组，预处理会序列化 */
  itemsJson: z
    .preprocess((raw) => {
      if (raw === undefined || raw === null) return SAMPLE_LIST_ITEMS_JSON;
      if (typeof raw === 'string') {
        return raw.trim() === '' ? '[]' : raw;
      }
      if (Array.isArray(raw)) return JSON.stringify(raw);
      if (typeof raw === 'object') return JSON.stringify(raw);
      return String(raw ?? '[]');
    }, z.string())
    .describe('Items JSON'),

  listMode: z.enum(['unordered', 'ordered']).default('unordered').describe('List mode'),

  unorderedMarker: z.enum(['disc', 'circle', 'square', 'dash', 'check', 'custom']).default('disc').describe('Bullet'),
  customBullet: z.string().default('•').describe('Custom bullet'),

  numberStyle: z.enum(['dot', 'parenClose', 'parenAround', 'plain']).default('dot').describe('Number style'),
  orderStart: z.number().int().min(-99999).max(99999).default(1).describe('Order start'),

  showLeading: z.boolean().default(true).describe('Show leading icon or list marker'),
  showLeftText: z.boolean().default(true).describe('Show left label'),
  showRightText: z.boolean().default(true).describe('Show right value'),

  leftFontSize: z.number().min(8).max(36).default(14).describe('Left font size'),
  rightFontSize: z.number().min(8).max(36).default(14).describe('Right font size'),
  leadingFontSize: z.number().min(8).max(36).default(14).describe('Leading / bullet size'),

  rowGap: z.number().min(0).max(64).default(10).describe('Row gap'),

  leftColor: z.string().default('').describe('Left text color'),
  rightColor: z.string().default('').describe('Right text color'),
  leadingColor: z.string().default('').describe('Leading marker / icon tint'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
