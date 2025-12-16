import { z } from 'zod';

export const NodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  props: z.record(z.any()).optional(),
  style: z.record(z.any()).optional(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  size: z
    .object({
      width: z.number().positive(),
      height: z.number().positive()
    })
    .optional(),
  parentId: z.string().optional()
});

export type NodeSchemaType = z.infer<typeof NodeSchema>;


