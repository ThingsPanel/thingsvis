import { z } from 'zod';

export const PropsSchema = z.object({
  /** Physical height represented by a full tank (scale max), meters */
  maxMeters: z.number().min(0.1).max(100).default(3),
  /** Liquid level in meters (0 … maxMeters) */
  level: z.number().min(0).default(1.5),
  tankColor: z.string().default('#334155'),
  liquidColor: z.string().default('#0ea5e9'),
  lowColor: z.string().default('#eab308'),
  highColor: z.string().default('#ef4444'),
  lowThreshold: z.number().min(0).default(0.6),
  highThreshold: z.number().min(0).default(2.4),
  hasError: z.boolean().default(false),
});

export type Props = z.infer<typeof PropsSchema>;
