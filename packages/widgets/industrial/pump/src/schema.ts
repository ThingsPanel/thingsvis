import { z } from 'zod';

export const PropsSchema = z.object({
  baseColor: z.string().default('#444444'),
  isRunning: z.boolean().default(false),
  hasError: z.boolean().default(false),
  rpm: z.number().default(1),
});

export type Props = z.infer<typeof PropsSchema>;
