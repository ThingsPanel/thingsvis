import { z } from 'zod';

export const PropsSchema = z.object({
  showSecondHand: z.boolean().default(true).describe('showSecondHand'),
  showNumbers: z.boolean().default(true).describe('showNumbers'),
  bezelWidth: z.number().min(4).max(24).default(10).describe('bezelWidth'),
  timeZone: z.string().default('').describe('timeZone'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
