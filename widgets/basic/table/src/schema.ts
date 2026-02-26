import { z } from 'zod';

export const PropsSchema = z.object({
    /** 表头配置 */
    columns: z.array(z.any()).default([
        { key: 'name', title: '名称' },
        { key: 'status', title: '状态' },
        { key: 'time', title: '时间' }
    ]).describe('props.tableColumns'),

    /** 表格数据 */
    data: z.array(z.any()).default([
        { name: '设备A', status: '在线', time: '10:00' },
        { name: '设备B', status: '离线', time: '10:05' },
        { name: '设备C', status: '运行中', time: '10:10' }
    ]).describe('props.tableData'),

    /** 表头背景色 */
    headerBg: z.string().default('#f3f4f6').describe('props.headerBgColor'),

    /** 表头文字颜色 */
    headerColor: z.string().default('#374151').describe('props.tableHeaderColor'),

    /** 行背景色 */
    rowBg: z.string().default('#ffffff').describe('props.tableRowBg'),

    /** 行文字颜色 */
    rowColor: z.string().default('#1f2937').describe('props.tableRowColor'),

    /** 边框颜色 */
    borderColor: z.string().default('#e5e7eb').describe('props.borderColor'),

    /** 文字大小 */
    fontSize: z.number().default(14).describe('props.tableFontSize'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
    return PropsSchema.parse({});
}
