import { z } from 'zod';

export const PropsSchema = z.object({
  openColor: z.string().default('#52c41a'),
  closedColor: z.string().default('#5c5c5c'),
  isOpen: z.boolean().default(false),
  hasError: z.boolean().default(false),
});

export type Props = z.infer<typeof PropsSchema>;
