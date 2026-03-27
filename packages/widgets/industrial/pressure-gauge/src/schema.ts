import { z } from 'zod';

export const PropsSchema = z.object({
  value: z.number().default(50),
  min: z.number().default(0),
  max: z.number().default(100),
  dialColor: z.string().default('#1e293b'),
  pointerColor: z.string().default('#fbbf24'),
  hasError: z.boolean().default(false),
});

export type Props = z.infer<typeof PropsSchema>;
