/**
 * Widget props schema
 */
import { z } from 'zod';

export const PropsSchema = z.object({
  fill: z.string().default('#6965db').describe('Fill color'),
  opacity: z.number().min(0).max(1).default(1).describe('Opacity'),
});

export type Props = z.infer<typeof PropsSchema>;

/** Get all default prop values from schema */
export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
