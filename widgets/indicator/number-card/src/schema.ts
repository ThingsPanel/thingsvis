import { z } from 'zod';

export const PropsSchema = z.object({
    /** 标题 */
    title: z.string().default('总访问量').describe('标题'),

    /** 数值 */
    value: z.number().default(1234.56).describe('数值'),

    /** 单位 */
    unit: z.string().default('次').describe('单位'),

    /** 数值颜色 */
    valueColor: z.string().default('#6965db').describe('数值颜色'),

    /** 标题颜色 */
    titleColor: z.string().default('#6b7280').describe('标题颜色'),

    /** 背景色 */
    backgroundColor: z.string().default('#ffffff').describe('背景色'),

    /** 圆角半径 */
    borderRadius: z.number().default(8).describe('圆角半径'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
    return PropsSchema.parse({});
}
