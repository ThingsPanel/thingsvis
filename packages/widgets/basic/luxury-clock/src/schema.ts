import { z } from 'zod';

export const PropsSchema = z.object({
  showSecondHand: z.boolean().default(true).describe('showSecondHand'),
  showNumbers: z.boolean().default(true).describe('showNumbers'),
  showTicks: z.boolean().default(true).describe('showTicks'),
  smoothSweep: z.boolean().default(true).describe('smoothSweep'),
  romanNumerals: z.boolean().default(false).describe('romanNumerals'),
  accentColor: z.string().default('').describe('accentColor'),
  timeZone: z.string().default('').describe('timeZone'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
