import { z } from 'zod';

export const CardStyleSchema = z.object({
  enabled: z.boolean().default(false),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  showSubtitle: z.boolean().default(false),
  titleFontSize: z.number().min(12).max(32).default(16),
});

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
  card: CardStyleSchema.optional(),
});

export type ICardStyle = z.infer<typeof CardStyleSchema>;
export type IBaseStyle = z.infer<typeof BaseStyleSchema>;
