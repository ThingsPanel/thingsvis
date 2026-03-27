import { z } from 'zod';

export const PropsSchema = z.object({
  useThemeColor: z.boolean().default(true).describe('props.useThemeColor'),
  color: z.string().default('#6965db').describe('props.color'),
  secondaryColor: z.string().default('#818cf8').describe('props.secondaryColor'),
  glowColor: z.string().default('#6965db').describe('props.glowColor'),
  
  borderWidth: z.number().min(1).max(6).default(2).describe('props.borderWidth'),
  glowWidth: z.number().min(0).max(10).default(4).describe('props.glowWidth'),
  flowLength: z.number().min(10).max(60).default(30).describe('props.flowLength'),
  opacity: z.number().min(0.1).max(1).default(1).describe('props.opacity'),
  
  glowIntensity: z.number().min(0.5).max(3).default(1.5).describe('props.glowIntensity'),
  showCornerDots: z.boolean().default(true).describe('props.showCornerDots'),
  
  animated: z.boolean().default(true).describe('props.animated'),
  flowDirection: z.enum(['clockwise', 'counterclockwise']).default('clockwise').describe('props.flowDirection'),
  animationSpeed: z.number().min(0.5).max(10).default(3).describe('props.animationSpeed'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
