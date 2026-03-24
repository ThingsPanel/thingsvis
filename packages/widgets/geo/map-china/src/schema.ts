import { z } from 'zod';

export const PropsSchema = z.object({
  areaColor: z.string().default('').describe('Area Color'),
  regionBorderColor: z.string().default('').describe('Region Border Color'),
  regionBorderWidth: z.number().min(0).max(10).default(1).describe('Region Border Width'),
  borderColor: z.string().optional().describe('Legacy Region Border Color'),
  borderWidth: z.number().min(0).max(10).optional().describe('Legacy Region Border Width'),
  emphasisAreaColor: z.string().default('').describe('Emphasis Area Color'),
  showLabel: z.boolean().default(false).describe('Show Province Label'),
  labelColor: z.string().default('').describe('Label Color'),
  visualMapMin: z.number().default(0).describe('VisualMap Min Value'),
  visualMapMax: z.number().default(100).describe('VisualMap Max Value'),
  inRangeColorStart: z.string().default('#e0ffff').describe('VisualMap Color Start'),
  inRangeColorEnd: z.string().default('#006edd').describe('VisualMap Color End'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
