import { z } from 'zod';

export const PropsSchema = z.object({
    /** 当前状态 */
    value: z.boolean().default(true).describe('props.switchStatus'),

    /** 开启颜色 */
    activeColor: z.string().default('#6965db').describe('props.activeColor'),

    /** 关闭颜色 */
    inactiveColor: z.string().default('#d1d5db').describe('props.inactiveColor'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
    return PropsSchema.parse({});
}
