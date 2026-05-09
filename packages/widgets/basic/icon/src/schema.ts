import { z } from 'zod';

export const PropsSchema = z.object({
  iconName: z.enum([
    'square',
    'circle',
    'triangle',
    'bolt',
    'star',
    'heart',
    'pin',
    'bell',
    'shield-check',
    'activity',
    'thermometer',
    'droplet',
    'gauge',
    'zap',
    'alert-triangle',
    'check-circle',
    'x-circle',
    'trending-up',
    'trending-down',
    'clock',
    'cpu',
  ]).default('square'),
  color: z.string().default('').describe('Icon color'),
  backgroundColor: z.string().default('transparent').describe('Background color'),
  backgroundOpacity: z.number().min(0).max(1).default(1).describe('Background opacity'),
  strokeWidth: z.number().min(1).max(4).default(2).describe('Stroke width'),
  paddingSize: z.number().min(0).max(32).default(12).describe('Padding'),
  cornerRadius: z.number().min(0).max(32).default(12).describe('Corner radius'),
  showFrame: z.boolean().default(false).describe('Show frame'),
  frameColor: z.string().default('rgba(148, 163, 184, 0.35)').describe('Frame color'),
  frameWidth: z.number().min(0).max(8).default(1).describe('Frame width'),
  opacity: z.number().min(0).max(1).default(1).describe('Opacity'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
