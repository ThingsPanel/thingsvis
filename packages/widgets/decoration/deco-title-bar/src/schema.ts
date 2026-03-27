import { z } from 'zod';

export const PropsSchema = z.object({
  color: z.string().default('#00E5FF').describe('props.color'),
  secondaryColor: z.string().default('#0055AA').describe('props.secondaryColor'),
  animated: z.boolean().default(true).describe('props.animated'),
  animationSpeed: z.number().min(0.5).max(10).default(3).describe('props.animationSpeed'),
  opacity: z.number().min(0.1).max(1).default(1).describe('props.opacity'),
});

export type Props = z.infer<typeof PropsSchema>;
export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
