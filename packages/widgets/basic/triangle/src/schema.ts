import { z } from 'zod';

export const PropsSchema = z.object({
  fill: z.string().default('#dbeafe').describe('props.fillColor'),
  stroke: z.string().default('transparent').describe('props.borderColor'),
  strokeWidth: z.number().min(0).max(20).default(0).describe('props.borderWidth'),
  cornerRadius: z.number().min(0).max(50).default(0).describe('props.borderRadius'),
  opacity: z.number().min(0).max(1).default(1).describe('props.opacityAlias'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
