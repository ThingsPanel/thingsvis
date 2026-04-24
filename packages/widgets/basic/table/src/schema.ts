import { z } from 'zod';

export const PropsSchema = z.object({
  /** Column definitions: [{ key: 'name', title: 'Name', align: 'left' }] */
  columns: z.array(z.any()).default([
    { key: 'name', title: '设备名称', align: 'left' },
    { key: 'status', title: '运行状态', align: 'center' },
    { key: 'value', title: '系统负载', align: 'right' }
  ]).describe('props.tableColumns'),

  /** Table data array */
  data: z.array(z.any()).default([
    { name: '1号冷水机组', status: '在线', value: '78.5%' },
    { name: '2号冷却塔', status: '离线', value: '0%' },
    { name: '3号空压机', status: '运行中', value: '87.2%' },
    { name: '新风机组A', status: '在线', value: '42.1%' },
    { name: '新风机组B', status: '告警', value: '96.3%' },
    { name: '排风风机', status: '在线', value: '30.1%' }
  ]).describe('props.tableData'),

  // Widget Title
  title: z.string().default('表格组件').describe('props.title'),
  showTitle: z.boolean().default(false).describe('props.showTitle'),

  // Header Styles
  showHeader: z.boolean().default(true).describe('props.showHeader'),
  headerFontSize: z.number().default(14).describe('props.headerFontSize'),
  headerWeight: z.string().default('600').describe('props.headerWeight'),
  headerColor: z.string().default('auto').describe('props.headerColor'),
  headerBgColor: z.string().default('auto').describe('props.headerBgColor'),

  // Body Styles & Layout
  bodyFontSize: z.number().default(13).describe('props.bodyFontSize'),
  bodyWeight: z.string().default('400').describe('props.bodyWeight'),
  bodyColor: z.string().default('auto').describe('props.bodyColor'),
  showBorder: z.boolean().default(true).describe('props.showBorder'),
  showStripe: z.boolean().default(false).describe('props.showStripe'),
  stripeColor: z.string().default('auto').describe('props.stripeColor'),
  
  // Density
  cellPadding: z.number().default(10).describe('props.cellPadding'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
