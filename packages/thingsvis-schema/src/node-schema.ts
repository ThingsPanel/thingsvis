import { z } from 'zod';
import { DataBindingSchema } from './datasource/index';

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
  parentId: z.string().optional(),
  data: z.array(DataBindingSchema).optional()
});

export type NodeSchemaType = z.infer<typeof NodeSchema>;


