import type { NextAuthConfig } from 'next-auth'

/**
 * Edge-compatible NextAuth configuration.
 * This file must NOT import PrismaClient or any Node.js-only modules
 * because it is used by Next.js middleware which runs in the Edge Runtime.
 */
export default {
    session: { strategy: 'jwt' },
    pages: {
        signIn: '/login',
    },
    providers: [],  // Providers with DB access are added in auth.ts
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id as string
                token.role = user.role as string
                token.tenantId = user.tenantId as string
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
                session.user.tenantId = token.tenantId as string
            }
            return session
        },
    },
} satisfies NextAuthConfig
