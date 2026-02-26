import { z } from 'zod';

export const PropsSchema = z.object({
    /** 标题 */
    title: z.string().default('总访问量').describe('props.title'),

    /** 数值 */
    value: z.number().default(1234.56).describe('props.value'),

    /** 单位 */
    unit: z.string().default('次').describe('props.unit'),

    /** 数值颜色 */
    valueColor: z.string().default('#6965db').describe('props.valueColor'),

    /** 标题颜色 */
    titleColor: z.string().default('#6b7280').describe('props.titleColor'),

    /** 背景色 */
    backgroundColor: z.string().default('#ffffff').describe('props.bgColor'),

    /** 圆角半径 */
    borderRadius: z.number().default(8).describe('props.borderRadius'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
    return PropsSchema.parse({});
}
