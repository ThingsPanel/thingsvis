import { z } from 'zod';

export const PropsSchema = z.object({
  iconSource: z.enum(['local', 'builtin']).default('local'),
  localIconId: z.string().default('').describe('Local categorized icon id'),
  assetKind: z.enum(['svg', 'image']).default('svg').describe('Local asset type'),
  assetUrl: z.string().default('').describe('Local asset URL'),
  svgContent: z.string().default('').describe('Cached inline SVG content'),
  iconName: z
    .enum([
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
    ])
    .default('square'),
  color: z.string().default('').describe('Icon color'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
