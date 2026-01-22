# Research: Configure NextAuth.js for Authentication

**Feature Branch**: `001-nextauth-config`  
**Date**: January 22, 2026  
**Status**: Complete

## Research Tasks

### 1. NextAuth.js v5 (Auth.js) Best Practices

**Task**: Find best practices for NextAuth.js v5 with Next.js 15 App Router

**Decision**: Use NextAuth.js v5 beta with the following configuration pattern:
- Export `auth`, `signIn`, `signOut`, `handlers` from a central `src/lib/auth.ts` file
- Use `handlers` in the catch-all route `api/auth/[...nextauth]/route.ts`
- Use `auth` function in middleware and server components for session access

**Rationale**: 
- NextAuth.js v5 is the current recommended version for Next.js 13+ App Router
- Centralized auth config allows reuse across routes and middleware
- JWT strategy is simpler than database sessions for stateless authentication

**Alternatives Considered**:
1. **Lucia Auth** - More lightweight but less ecosystem support, rejected for maturity reasons
2. **Custom JWT implementation** - More control but reinvents the wheel, rejected for maintenance burden
3. **NextAuth.js v4** - Pages Router focused, incompatible with App Router patterns

---

### 2. JWT Session Strategy Configuration

**Task**: Research JWT session configuration for multi-tenant context

**Decision**: Configure JWT callbacks to include custom claims:
- `jwt` callback: Add `id`, `role`, `tenantId` to token when user signs in
- `session` callback: Copy token claims to `session.user` for client access

**Rationale**:
- JWT strategy eliminates need for session database lookups
- Custom claims enable authorization without additional DB queries
- 30-day default expiry is reasonable for dashboard applications

**Alternatives Considered**:
1. **Database sessions** - More secure (revocable) but adds latency, rejected for simplicity
2. **Refresh token rotation** - Adds complexity, not needed for MVP
3. **Short-lived tokens with refresh** - Overkill for internal dashboard app

---

### 3. Middleware Protection Pattern

**Task**: Research Next.js middleware patterns for API route protection

**Decision**: Use NextAuth.js `auth` wrapper for middleware:
```typescript
export default auth((req) => {
  // req.auth contains session if authenticated
  // Return Response.json() for API routes, redirect for pages
})
```

**Rationale**:
- Built-in integration with NextAuth.js session
- Runs on Edge Runtime for low latency
- Path matching via `matcher` config for selective protection

**Alternatives Considered**:
1. **Per-route auth checks** - Repetitive, error-prone, rejected
2. **Custom middleware with jose** - Reinvents NextAuth.js, rejected
3. **tRPC with auth context** - Different paradigm, not needed for REST API

---

### 4. Password Hashing with bcryptjs

**Task**: Research bcrypt configuration for password security

**Decision**: Use `bcryptjs` with cost factor 12:
- `hash(password, 12)` for registration
- `compare(password, hash)` for login verification

**Rationale**:
- Cost factor 12 provides ~300ms hash time, good balance of security and UX
- `bcryptjs` is pure JavaScript (no native dependencies), works in all environments
- Industry standard for password hashing

**Alternatives Considered**:
1. **bcrypt (native)** - Faster but requires native compilation, deployment issues
2. **Argon2** - More modern but less ecosystem support in Node.js
3. **Cost factor 10** - Too fast (~100ms), less secure against brute force
4. **Cost factor 14** - Too slow (~1.2s), poor UX

---

### 5. TypeScript Type Augmentation

**Task**: Research NextAuth.js type extension patterns

**Decision**: Create `src/types/next-auth.d.ts` with module augmentation:
- Extend `User` interface for `authorize` return type
- Extend `Session` interface for client-side session shape
- Extend `JWT` interface for token claims

**Rationale**:
- TypeScript strict mode requires proper typing
- Module augmentation is the official NextAuth.js pattern
- Enables IDE autocomplete for custom session properties

**Alternatives Considered**:
1. **Type assertions everywhere** - Unsafe, defeats TypeScript purpose
2. **Wrapper functions with generics** - Overcomplicated
3. **Ignore types** - Not compatible with strict mode

---

## Summary of Decisions

| Area | Decision | Key Reasoning |
|------|----------|---------------|
| Auth Library | NextAuth.js v5 (Auth.js) | Mature, App Router native, extensible |
| Session Strategy | JWT (not database) | Stateless, no DB lookups, simpler |
| Password Hashing | bcryptjs, cost 12 | Pure JS, ~300ms hash time, secure |
| Middleware | auth() wrapper | Built-in session, Edge Runtime |
| Type Safety | Module augmentation | Official pattern, strict mode compatible |

## Unresolved Items

None - all research questions resolved.
