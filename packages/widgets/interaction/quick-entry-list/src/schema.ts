import { z } from 'zod';

export const QuickEntryItemSchema = z.object({
  id: z.string().default('entry'),
  title: z.string().default('快捷入口'),
  description: z.string().optional().default(''),
  icon: z.string().optional().default('link'),
  iconColor: z.string().optional().default('#4f67ff'),
  iconBackgroundColor: z.string().optional().default('#eef1ff'),
  url: z.string().optional().default(''),
  target: z.enum(['auto', '_blank', '_self', '_top']).optional().default('auto'),
  disabled: z.boolean().optional().default(false),
});

export type QuickEntryItem = z.infer<typeof QuickEntryItemSchema>;

export const DEFAULT_ITEMS: QuickEntryItem[] = [
  {
    id: 'ai-chat',
    title: 'ThingsPanel 智能问答',
    description: '查询配置、接入和使用问题',
    icon: 'bot',
    iconColor: '#2563eb',
    iconBackgroundColor: '#eef2ff',
    url: 'https://aichat.thingspanel.cn/',
    target: '_blank',
    disabled: false,
  },
  {
    id: 'docs',
    title: '官方文档',
    description: '快速开始和操作手册',
    icon: 'book-open',
    iconColor: '#536dfe',
    iconBackgroundColor: '#f0f2ff',
    url: 'https://docs.thingspanel.cn/zh-Hans/',
    target: '_blank',
    disabled: false,
  },
  {
    id: 'open-source',
    title: '项目开源地址',
    description: '查看源码、提交问题和参与贡献',
    icon: 'github',
    iconColor: '#334155',
    iconBackgroundColor: '#f1f5f9',
    url: 'https://github.com/ThingsPanel/thingsvis',
    target: '_blank',
    disabled: false,
  },
];

export const PropsSchema = z.object({
  title: z.string().default('智能问答与文档'),
  showTitle: z.boolean().default(true),
  items: z.array(QuickEntryItemSchema).default(DEFAULT_ITEMS),
  showDivider: z.boolean().default(true),
  titleFontSize: z.number().min(12).max(32).default(18),
  itemTitleFontSize: z.number().min(12).max(28).default(16),
  descriptionFontSize: z.number().min(10).max(24).default(13),
  iconSize: z.number().min(32).max(80).default(52),
  itemPadding: z.number().min(8).max(32).default(16),
  textColor: z.string().default('#172033'),
  descriptionColor: z.string().default('#64748b'),
  dividerColor: z.string().default('#e8edf5'),
  hoverColor: z.string().default('#f8faff'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
