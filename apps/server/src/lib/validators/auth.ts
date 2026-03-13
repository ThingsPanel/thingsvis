import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(100).optional(),
  tenantId: z.string().cuid().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

/**
 * SSO Token Exchange Schema
 * Used for host platform SSO integrations (e.g., custom platforms)
 */
export const SSOExchangeSchema = z.object({
  platform: z.string().min(1),
  platformToken: z.string().min(1),
  userInfo: z.object({
    id: z.string().min(1),
    email: z.string().email(),
    name: z.string().optional(),
    tenantId: z.string().min(1),
  }),
});

export type SSOExchangeInput = z.infer<typeof SSOExchangeSchema>;
