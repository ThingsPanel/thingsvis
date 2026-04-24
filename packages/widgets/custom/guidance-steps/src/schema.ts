import { z } from 'zod';

export const StepItemSchema = z.object({
  title: z.string().default('步骤标题'),
  description: z.string().optional(),
  linkText: z.string().optional(),
  linkUrl: z.string().optional(),
  actionText: z.string().optional(),
  actionUrl: z.string().optional(),
  actionIcon: z.string().optional(),
  target: z.enum(['_blank', '_self', '_top']).optional(),
});

export type StepItem = z.infer<typeof StepItemSchema>;

export const DEFAULT_GUIDANCE_STEPS_ZH: StepItem[] = [
  {
    title: '添加设备',
    description: '将设备接入平台并开始统一管理',
    linkText: '设备管理',
    linkUrl: '/device/manage',
  },
  {
    title: '配置设备',
    description: '设置属性、参数与数据采集规则',
    linkText: '设备管理',
    linkUrl: '/device/manage',
  },
  {
    title: '创建看板',
    description: '组合组件构建实时监控与分析视图',
    linkText: '看板管理',
    linkUrl: '/visualization/thingsvis',
  },
];

export const DEFAULT_GUIDANCE_STEPS_EN: StepItem[] = [
  {
    title: 'Add device',
    description: 'Connect devices to the platform and start unified management.',
    linkText: 'Devices',
    linkUrl: '/device/manage',
  },
  {
    title: 'Configure device',
    description: 'Set attributes, parameters, and data collection rules.',
    linkText: 'Devices',
    linkUrl: '/device/manage',
  },
  {
    title: 'Create dashboard',
    description: 'Combine components to build real-time monitoring and analytics views.',
    linkText: 'Dashboards',
    linkUrl: '/visualization/thingsvis',
  },
];

export const PropsSchema = z.object({
  items: z.array(StepItemSchema).default(DEFAULT_GUIDANCE_STEPS_ZH),
  themeColor: z.string().default('#6965db'),
  titleFontSize: z.number().min(10).max(40).default(16),
  descFontSize: z.number().min(10).max(40).default(14),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
