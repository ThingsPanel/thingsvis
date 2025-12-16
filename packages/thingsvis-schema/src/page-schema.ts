import { z } from 'zod';

export const PageSchema = z.object({
  id: z.string(),
  version: z.string(),
  type: z.string()
});

export type Page = z.infer<typeof PageSchema>;

