import { z } from 'zod';

export const PropsSchema = z.object({
  columns: z.array(z.any()).default([
    { key: 'deviceName', title: '设备名称', align: 'left' },
    { key: 'isOnline', title: '运行状态', align: 'center' },
    { key: 'groupName', title: '设备分组', align: 'left' },
  ]).describe('props.tableColumns'),

  title: z.string().default('设备列表').describe('props.title'),
  showTitle: z.boolean().default(false).describe('props.showTitle'),

  pageSize: z.number().min(1).max(100).default(10).describe('props.pageSize'),
  groupId: z.string().default('__all__').describe('props.groupId'),
  keyword: z.string().default('').describe('props.keyword'),
  deviceConfigId: z.string().default('').describe('props.deviceConfigId'),

  showHeader: z.boolean().default(true).describe('props.showHeader'),
  headerFontSize: z.number().default(14).describe('props.headerFontSize'),
  headerWeight: z.string().default('600').describe('props.headerWeight'),
  headerColor: z.string().default('auto').describe('props.headerColor'),
  headerBgColor: z.string().default('auto').describe('props.headerBgColor'),

  bodyFontSize: z.number().default(13).describe('props.bodyFontSize'),
  bodyWeight: z.string().default('400').describe('props.bodyWeight'),
  bodyColor: z.string().default('auto').describe('props.bodyColor'),
  showBorder: z.boolean().default(true).describe('props.showBorder'),
  rowBorderColor: z.string().default('auto').describe('props.rowBorderColor'),
  showStripe: z.boolean().default(false).describe('props.showStripe'),
  stripeColor: z.string().default('auto').describe('props.stripeColor'),
  cellPadding: z.number().default(10).describe('props.cellPadding'),

  /** 表格区域横向溢出时显示滚动条 */
  scrollEnabled: z.boolean().default(true).describe('props.scrollEnabled'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
