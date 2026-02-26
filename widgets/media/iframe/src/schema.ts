import { z } from 'zod';

export const PropsSchema = z.object({
    /** 网页地址 */
    src: z.string().default('https://cn.bing.com/').describe('网页地址'),

    /** 边框宽度 */
    borderWidth: z.number().default(0).describe('边框宽度'),

    /** 边框颜色 */
    borderColor: z.string().default('#000000').describe('props.borderColor'),

    /** 圆角半径 */
    borderRadius: z.number().default(0).describe('圆角半径'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
    return PropsSchema.parse({});
}
