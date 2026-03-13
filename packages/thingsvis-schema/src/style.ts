import { z } from 'zod';

export const BaseStyleSchema = z.object({
  background: z
    .object({
      color: z.string().optional(),
      image: z.string().optional(),
      opacity: z.number().min(0).max(1).default(1),
    })
    .optional(),
  border: z
    .object({
      width: z.number().min(0).optional(),
      color: z.string().optional(),
      style: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
      radius: z.number().min(0).optional(),
    })
    .optional(),
  shadow: z
    .object({
      color: z.string().optional(),
      blur: z.number().optional(),
      offsetX: z.number().optional(),
      offsetY: z.number().optional(),
    })
    .optional(),
  padding: z.number().min(0).optional(),
  opacity: z.number().min(0).max(1).default(1),
});

export type IBaseStyle = z.infer<typeof BaseStyleSchema>;
