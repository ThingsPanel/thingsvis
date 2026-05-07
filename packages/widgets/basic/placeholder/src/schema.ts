import { z } from 'zod';

export const PropsSchema = z.object({
  title: z.string().default('待放置内容').describe('Title'),
  description: z.string().default('可用于占位、草稿排版或模板预留区域。').describe('Description'),
  icon: z.enum(['frame', 'image', 'chart']).default('frame').describe('Icon'),
  borderStyle: z.enum(['dashed', 'solid']).default('dashed').describe('Border style'),
  titleFontSize: z.number().min(12).max(28).default(16).describe('Title font size'),
  bodyFontSize: z.number().min(10).max(20).default(12).describe('Body font size'),
  accentColor: z.string().default('#64748b').describe('Accent color'),
  backgroundColor: z.string().default('rgba(248,250,252,0.9)').describe('Background color'),
  borderColor: z.string().default('rgba(148,163,184,0.45)').describe('Border color'),
  borderWidth: z.number().min(0).max(8).default(1).describe('Border width'),
  cornerRadius: z.number().min(0).max(32).default(14).describe('Corner radius'),
  opacity: z.number().min(0).max(1).default(1).describe('Opacity'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
