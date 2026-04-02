import { z } from 'zod';

export const PropsSchema = z.object({
  hourCycle: z.enum(['24h', '12h']).default('24h').describe('hourCycle'),
  showSeconds: z.boolean().default(true).describe('showSeconds'),
  showDate: z.boolean().default(true).describe('showDate'),
  align: z.enum(['left', 'center', 'right']).default('center').describe('align'),
  timeFontSize: z.number().min(18).max(120).default(32).describe('timeFontSize'),
  dateFontSize: z.number().min(10).max(48).default(16).describe('dateFontSize'),
  timeColor: z.string().default('').describe('timeColor'),
  dateColor: z.string().default('').describe('dateColor'),
  timeZone: z.string().default('').describe('timeZone'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
