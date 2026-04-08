import { z } from 'zod';

export const PropsSchema = z.object({
  // 变体选择
  variant: z
    .enum(['scan-line', 'slide-bar', 'hex-chain', 'signal-wave', 'dot-chain', 'bracket-ends', 'diamond-trail', 'dot-matrix-flash'])
    .default('dot-chain'),

  // 颜色
  useThemeColor: z.boolean().default(true).describe('props.useThemeColor'),
  primaryColor: z.string().default('#00c2ff').describe('props.primaryColor'),
  secondaryColor: z.string().default('#00d4ff').describe('props.secondaryColor'),

  // 动画
  animated: z.boolean().default(true).describe('props.animated'),
  animationSpeed: z
    .number()
    .min(0.5)
    .max(10)
    .default(3)
    .describe('props.animationSpeed'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
