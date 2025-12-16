import { z } from 'zod';
import { NodeSchema } from './node-schema';

export const PageSchema = z.object({
  id: z.string(),
  version: z.string(),
  type: z.string(),
  nodes: z.array(NodeSchema),
  metadata: z.record(z.any()).optional()
});

export type PageSchemaType = z.infer<typeof PageSchema>;

