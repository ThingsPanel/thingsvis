import { z } from 'zod';

export const PropsSchema = z.object({
  showSecondHand: z.boolean().default(true).describe('showSecondHand'),
  showNumbers: z.boolean().default(true).describe('showNumbers'),
  bezelWidth: z.number().min(4).max(24).default(10).describe('bezelWidth'),
  dialColor: z.string().default('').describe('dialColor'),
  bezelColor: z.string().default('').describe('bezelColor'),
  numberColor: z.string().default('').describe('numberColor'),
  hourHandColor: z.string().default('').describe('hourHandColor'),
  minuteHandColor: z.string().default('').describe('minuteHandColor'),
  secondHandColor: z.string().default('').describe('secondHandColor'),
  centerColor: z.string().default('').describe('centerColor'),
  centerBorderColor: z.string().default('').describe('centerBorderColor'),
  timeZone: z.string().default('').describe('timeZone'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
