import { z } from 'zod';

export const PropsSchema = z.object({
    /** 网页地址 */
    src: z.string().default('').describe('props.iframeUrl'),
    title: z.string().default('网页').describe('props.title'),
    showHeader: z.boolean().default(false).describe('props.showHeader'),
    showRefresh: z.boolean().default(true).describe('props.showRefresh'),
    showOpenExternal: z.boolean().default(true).describe('props.showOpenExternal'),
    showFullscreen: z.boolean().default(true).describe('props.showFullscreen'),
    loadTimeout: z.number().min(3).max(60).default(10).describe('props.loadTimeout'),
    sandboxEnabled: z.boolean().default(true).describe('props.sandboxEnabled'),
    allowFullscreen: z.boolean().default(true).describe('props.allowFullscreen'),
    allowPopups: z.boolean().default(false).describe('props.allowPopups'),
    allowDownloads: z.boolean().default(false).describe('props.allowDownloads'),

    /** 边框宽度 */
    borderWidth: z.number().default(0).describe('props.borderWidth'),

    /** 边框颜色 */
    borderColor: z.string().default('#000000').describe('props.borderColor'),

    /** 圆角半径 */
    borderRadius: z.number().default(0).describe('props.borderRadius'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
    return PropsSchema.parse({});
}
