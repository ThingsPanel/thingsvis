import { z } from 'zod';

export const PropsSchema = z.object({
  value: z.number().default(50),
  min: z.number().default(0),
  max: z.number().default(100),
  baseColor: z.string().default('#475569'),
  liquidColor: z.string().default('#0ea5e9'),
  flowSpeed: z.number().default(1),
  hasError: z.boolean().default(false),
  showValue: z.boolean().default(true),
});

export type Props = z.infer<typeof PropsSchema>;
