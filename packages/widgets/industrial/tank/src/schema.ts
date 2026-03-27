import { z } from 'zod';

export const PropsSchema = z.object({
  level: z.number().min(0).max(100).default(50),
  tankColor: z.string().default('#334155'),
  liquidColor: z.string().default('#0ea5e9'),
  lowColor: z.string().default('#eab308'),
  highColor: z.string().default('#ef4444'),
  lowThreshold: z.number().min(0).max(100).default(20),
  highThreshold: z.number().min(0).max(100).default(80),
  hasError: z.boolean().default(false),
});

export type Props = z.infer<typeof PropsSchema>;
