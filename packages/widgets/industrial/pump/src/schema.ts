import { z } from 'zod';

export const PropsSchema = z.object({
  baseColor: z.string().default('#334155').describe('props.baseColor'),
  isRunning: z.boolean().default(false).describe('props.isRunning'),
  hasError: z.boolean().default(false).describe('props.hasError'),
  rpm: z.number().default(60).describe('props.rpm'),
});

export type Props = z.infer<typeof PropsSchema>;
