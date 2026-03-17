import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from './db';
import authConfig from './auth.config';
import { LOCAL_AUTH_TYPE, STANDALONE_LOGIN_SOURCE } from './validators/auth';

/**
 * Full NextAuth configuration with Credentials provider.
 * This file imports PrismaClient and is NOT Edge-compatible.
 * Use only in server-side code (API routes, server components).
 * For middleware, import from auth.config.ts instead.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { tenant: true },
        });

        if (!user || user.authType !== LOCAL_AUTH_TYPE || !user.passwordHash) return null;

        const isValid = await compare(credentials.password as string, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.displayEmail || user.email,
          name: user.name,
          role: user.role,
          authType: user.authType,
          loginSource: STANDALONE_LOGIN_SOURCE,
          tenantId: user.tenantId,
        };
      },
    }),
  ],
});
