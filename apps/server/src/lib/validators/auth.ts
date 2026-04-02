import { z } from 'zod';

export const LOCAL_AUTH_TYPE = 'LOCAL' as const;
export const SSO_AUTH_TYPE = 'SSO' as const;
export const AUTH_TYPES = [LOCAL_AUTH_TYPE, SSO_AUTH_TYPE] as const;
export type AuthType = (typeof AUTH_TYPES)[number];

export const STANDALONE_LOGIN_SOURCE = 'standalone' as const;
export const EMBED_SSO_LOGIN_SOURCE = 'embed-sso' as const;
export const LOGIN_SOURCES = [STANDALONE_LOGIN_SOURCE, EMBED_SSO_LOGIN_SOURCE] as const;
export type LoginSource = (typeof LOGIN_SOURCES)[number];

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(100).optional(),
  tenantId: z.string().cuid().optional(),
  role: z.enum(['SUPER_ADMIN', 'TENANT_ADMIN']).optional(),
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
  role: z.enum(['SUPER_ADMIN', 'TENANT_ADMIN']).optional(),
});

export type SSOExchangeInput = z.infer<typeof SSOExchangeSchema>;
