import { z } from 'zod';

export const PropsSchema = z.object({
  useThemeColor: z.boolean().default(true).describe('props.useThemeColor'),

  variant: z.enum(['corner-cut', 'tech-lines', 'glow', 'simple']).default('corner-cut'),
  borderColor: z.string().default('#6965db').describe('props.borderColor'),
  borderWidth: z.number().min(1).max(10).default(2).describe('props.borderWidth'),
  contentPadding: z.number().min(0).max(40).default(12).describe('props.contentPadding'),
  backgroundColor: z.string().default('transparent').describe('props.backgroundColor'),

  glowEnabled: z.boolean().default(true).describe('props.glowEnabled'),
  glowColor: z.string().default('').describe('props.glowColor'),
  glowBlur: z.number().min(0).max(50).default(8).describe('props.glowBlur'),
  glowSpread: z.number().min(0).max(20).default(2).describe('props.glowSpread'),

  cornerSize: z.number().min(0).max(50).default(8).describe('props.cornerSize'),
  showCornerDecoration: z.boolean().default(true).describe('props.showCornerDecoration'),
  decorationLength: z.number().min(5).max(100).default(30).describe('props.decorationLength'),
  decorationWidth: z.number().min(1).max(10).default(3).describe('props.decorationWidth'),

  animated: z.boolean().default(false).describe('props.animated'),
  animationSpeed: z.number().min(0.5).max(10).default(3).describe('props.animationSpeed'),
  animationDirection: z
    .enum(['clockwise', 'counter-clockwise'])
    .default('clockwise')
    .describe('props.animationDirection'),

  gradientEnabled: z.boolean().default(true).describe('props.gradientEnabled'),
  gradientStart: z.string().default('#6965db').describe('props.gradientStart'),
  gradientEnd: z.string().default('#6965db').describe('props.gradientEnd'),
  gradientAngle: z.number().min(0).max(360).default(45).describe('props.gradientAngle'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
