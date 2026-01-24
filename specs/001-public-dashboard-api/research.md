# Research: Public Dashboard Access API

**Feature**: 001-public-dashboard-api  
**Date**: January 22, 2026  
**Status**: Complete

## Research Tasks

### 1. Token Generation Strategy

**Question**: What is the best approach for generating secure, URL-safe share tokens?

**Decision**: Use `nanoid` library with custom alphabet

**Rationale**:
- `nanoid` is a tiny (130 bytes), secure, URL-friendly unique string ID generator
- Faster than UUID and produces shorter IDs
- Configurable length and alphabet for URL safety
- Already a pattern used in production systems

**Alternatives Considered**:
- `uuid` - Longer strings (36 chars), less URL-friendly with hyphens
- `crypto.randomUUID()` - Native but same length issues as uuid
- Custom implementation - Unnecessary complexity, potential security issues

**Implementation**:
```typescript
import { nanoid } from 'nanoid'
const shareToken = `share_${nanoid(16)}` // e.g., "share_V1StGXR8_Z5jdHi6B"
```

---

### 2. Password Storage Security

**Question**: How should share link passwords be stored securely?

**Decision**: Use `bcryptjs` for password hashing (already in dependencies)

**Rationale**:
- `bcryptjs` is already a project dependency
- Industry-standard password hashing with built-in salt
- Configurable cost factor for security/performance balance
- Pure JavaScript implementation (no native dependencies)

**Alternatives Considered**:
- Argon2 - More modern but requires native bindings
- PBKDF2 - Built-in to Node.js but bcrypt is more resistant to GPU attacks
- SHA-256 with salt - Not designed for password hashing, too fast

**Implementation**:
```typescript
import bcrypt from 'bcryptjs'
const hashedPassword = await bcrypt.hash(password, 10)
const isValid = await bcrypt.compare(inputPassword, hashedPassword)
```

---

### 3. Existing Schema Analysis

**Question**: Does the existing Dashboard model support sharing features?

**Decision**: Use existing fields - no schema migration required

**Findings**: The Dashboard model already has:
```prisma
isPublished Boolean   @default(false)
publishedAt DateTime?
shareToken  String?   @unique
shareConfig String? // JSON: { password?, expiresAt? }
```

**Rationale**:
- Schema was designed with sharing in mind (015-dashboards-crud-api)
- `shareConfig` JSON field provides flexibility for password and expiration
- Index already exists on `shareToken` for efficient lookups

---

### 4. Authorization Pattern

**Question**: What authorization check should be used for dashboard operations?

**Decision**: Tenant-based ownership via project relationship

**Rationale**:
- Existing pattern in dashboard CRUD: `project: { tenantId: user.tenantId }`
- Dashboards belong to projects, projects belong to tenants
- User's `tenantId` determines access scope

**Implementation**:
```typescript
const dashboard = await prisma.dashboard.findFirst({
  where: { id, project: { tenantId: user.tenantId } },
})
```

---

### 5. Public Endpoint Security

**Question**: How to handle unauthenticated access to public dashboard endpoint?

**Decision**: Token-based access with optional password protection

**Rationale**:
- Share token acts as a capability token (possession = access)
- Password adds optional second factor for sensitive dashboards
- Expiration time provides time-limited access control
- No session/cookie needed for stateless access

**Security Measures**:
1. Token is cryptographically random (nanoid)
2. Token is unique (database constraint)
3. Optional password hashed with bcrypt
4. Expiration checked server-side
5. Only published dashboards accessible

---

### 6. API Response Structure

**Question**: What data should the public endpoint return?

**Decision**: Return minimal rendering data without metadata

**Rationale**:
- Public visitors only need data to render the dashboard
- Exclude sensitive info: `createdBy`, `project`, `shareConfig`
- Parse JSON fields for consistent response format

**Public Response Schema**:
```typescript
{
  id: string
  name: string
  canvasConfig: { mode, width, height, background }
  nodes: NodeSchema[]
  dataSources: DataSourceConfig[]
}
```

---

## Dependencies

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| nanoid | ^5.0.0 | Token generation | TO INSTALL |
| bcryptjs | ^3.0.3 | Password hashing | EXISTING |
| zod | ^3.23.0 | Request validation | EXISTING |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Token collision | Very Low | High | nanoid has 10^28 combinations at 16 chars |
| Password brute force | Medium | Medium | Rate limiting at infrastructure level |
| Expired token access | Low | Low | Server-side expiration check on every request |
| Unpublished dashboard leak | Low | Medium | Double-check `isPublished` in public query |

## Open Questions

None - all technical questions resolved.
