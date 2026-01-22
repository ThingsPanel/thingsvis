# Research: User Registration API

**Feature**: 001-user-registration-api  
**Date**: 2026-01-22  
**Status**: Complete

## Research Tasks

### 1. bcrypt Best Practices for Password Hashing

**Task**: Research bcrypt configuration for Node.js/Next.js environment

**Decision**: Use bcryptjs with cost factor 12

**Rationale**:
- bcryptjs is the pure JavaScript implementation, avoiding native compilation issues
- Cost factor 12 provides ~250ms hashing time on modern hardware, balancing security and UX
- Already installed in thingsvis-server package (`bcryptjs: ^3.0.3`)
- Industry standard recommendation is cost 10-12 for production

**Alternatives Considered**:
- argon2: More modern, but adds native dependency complexity
- scrypt: Good alternative but less widespread tooling support
- bcrypt (native): Faster but requires node-gyp compilation

### 2. Zod Validation Patterns for Auth

**Task**: Find best practices for Zod validation in Next.js API routes

**Decision**: Use safeParse with typed error responses

**Rationale**:
- `safeParse()` returns typed result without throwing, enabling clean error handling
- `flatten()` provides structured error format suitable for API responses
- Zod already in package.json (`zod: ^3.23.0`)
- Matches existing validation patterns in codebase

**Alternatives Considered**:
- Direct parse with try/catch: Less type-safe error handling
- express-validator: Not applicable for Next.js App Router
- class-validator: Requires decorator syntax, more verbose

### 3. Email Validation Standards

**Task**: Research RFC-compliant email validation

**Decision**: Use Zod's built-in email validator with additional length constraint

**Rationale**:
- Zod's `.email()` uses a regex based on RFC 5322 simplified pattern
- Maximum email length per RFC 5321 is 254 characters
- Simple solution sufficient for registration; advanced validation (MX lookup) deferred

**Alternatives Considered**:
- validator.js isEmail: Additional dependency not needed
- Custom RFC 5322 regex: Over-engineering for this use case
- Email verification service: Out of scope for P0

### 4. Tenant Creation Strategy

**Task**: Research multi-tenant patterns for user registration

**Decision**: Auto-create tenant for first user; allow tenantId parameter for joining existing

**Rationale**:
- Simplifies first-user experience (no separate tenant setup required)
- Tenant slug uses timestamp for uniqueness, avoiding collision issues
- OWNER role for first user in tenant; VIEWER for subsequent users
- Existing Prisma schema supports this pattern with User.tenantId relation

**Alternatives Considered**:
- Require explicit tenant creation first: Adds friction to onboarding
- Invite-only registration: More complex, deferred to future enhancement
- Multiple tenants per user: Schema change required, out of scope

### 5. Error Response Format

**Task**: Establish consistent error response format for auth APIs

**Decision**: Use structured JSON with error message and optional details

**Rationale**:
- Format: `{ error: string, details?: object, code?: string }`
- HTTP status codes: 201 success, 400 validation, 404 not found, 500 server
- Consistent with existing health endpoint pattern in thingsvis-server
- details field includes Zod flattened errors for validation failures

**Alternatives Considered**:
- RFC 7807 Problem Details: More formal but adds complexity
- Simple string errors: Less informative for debugging
- Custom error codes: Deferred until error catalog needed

### 6. Concurrent Registration Race Condition

**Task**: Research handling duplicate email during concurrent requests

**Decision**: Rely on database unique constraint with proper error handling

**Rationale**:
- Prisma throws P2002 error on unique constraint violation
- Check existence first (for clear error message), let DB handle race condition
- Catch Prisma error and return appropriate 400 response
- No need for distributed locking at this scale

**Alternatives Considered**:
- Distributed lock (Redis): Over-engineering for current scale
- Optimistic locking: Not applicable for create operation
- No pre-check: Less user-friendly error messages

## Dependencies Verified

| Dependency | Version | Status |
|------------|---------|--------|
| bcryptjs | ^3.0.3 | ✅ Already installed |
| zod | ^3.23.0 | ✅ Already installed |
| @prisma/client | ^5.22.0 | ✅ Already installed |
| next | ^15.0.0 | ✅ Already installed |

## Schema Verification

Existing Prisma models support all requirements:

- `User.email`: String, unique ✅
- `User.passwordHash`: String, nullable ✅
- `User.name`: String, nullable ✅
- `User.role`: String, default "VIEWER" ✅
- `User.tenantId`: String, required ✅
- `Tenant.id`, `Tenant.name`, `Tenant.slug`: All present ✅

## Open Questions Resolved

| Question | Resolution |
|----------|------------|
| Email verification required? | No - deferred to future enhancement (Assumption in spec) |
| Rate limiting needed? | No - deferred to future enhancement (Assumption in spec) |
| Password complexity beyond length? | No - 8 char minimum per FR-003, complexity rules deferred |
| Session creation on register? | No - user must explicitly login after registration |
