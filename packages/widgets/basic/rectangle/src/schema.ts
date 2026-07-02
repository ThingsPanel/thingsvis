import { z } from 'zod';

export const PropsSchema = z.object({
  fill: z.string().default('#dbeafe').describe('props.fillColor'),
  opacity: z.number().min(0).max(1).default(1).describe('props.opacityAlias'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
