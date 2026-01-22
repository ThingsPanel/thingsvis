# Data Model: Configure NextAuth.js for Authentication

**Feature Branch**: `001-nextauth-config`  
**Date**: January 22, 2026

## Overview

This feature extends the existing User and Tenant models (from Prisma schema) with authentication-specific behavior. No new database entities are created; instead, we define runtime types for session/JWT handling.

## Existing Entities (Reference)

### User (from Prisma schema)

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| email | String | Unique, used for login |
| name | String? | Display name |
| passwordHash | String? | bcrypt hash, null for SSO users |
| role | String | OWNER, ADMIN, EDITOR, VIEWER |
| tenantId | String | Foreign key to Tenant |
| lastLoginAt | DateTime? | Updated on successful login |

### Tenant (from Prisma schema)

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| name | String | Organization name |
| slug | String | Unique URL-safe identifier |

## Runtime Types (New)

### SessionUser

Represents the user data available in authenticated sessions.

```typescript
interface SessionUser {
  id: string        // User.id
  email: string     // User.email
  name?: string     // User.name
  role: string      // User.role (OWNER|ADMIN|EDITOR|VIEWER)
  tenantId: string  // User.tenantId
}
```

**Used in**: `session.user` after successful authentication

### JWT Token Claims

Custom claims added to the JWT token.

```typescript
interface JWTClaims {
  id: string        // User.id
  role: string      // User.role
  tenantId: string  // User.tenantId
  // Standard claims (sub, iat, exp) handled by NextAuth.js
}
```

**Used in**: JWT token payload, accessible in `jwt` callback

### Credentials Input

Shape of credentials submitted for login.

```typescript
interface CredentialsInput {
  email: string     // Required, must be valid email format
  password: string  // Required, validated against passwordHash
}
```

**Used in**: `authorize` function of Credentials provider

## State Transitions

### Authentication Flow

```
┌─────────────┐    credentials    ┌─────────────┐    valid      ┌─────────────┐
│ Unauthenticated │ ──────────────► │  Authorize  │ ────────────► │ Authenticated │
└─────────────┘                   └─────────────┘               └─────────────┘
                                        │                              │
                                        │ invalid                      │ logout
                                        ▼                              ▼
                                  ┌─────────────┐              ┌─────────────┐
                                  │   Error     │              │ Unauthenticated │
                                  └─────────────┘              └─────────────┘
```

### Session Lifecycle

1. **Login**: User submits credentials → `authorize` validates → JWT created with claims
2. **Request**: Middleware checks `req.auth` → Allow or 401
3. **Session Access**: Server code calls `auth()` → Returns `Session` with user
4. **Logout**: User calls `signOut()` → JWT cookie cleared

## Validation Rules

### Email Validation
- Must be valid email format
- Must exist in User table (but error message does not reveal this)

### Password Validation
- Must match bcrypt hash in User.passwordHash
- User.passwordHash must not be null (SSO users cannot use credentials)

### Role Values
- Valid roles: `OWNER`, `ADMIN`, `EDITOR`, `VIEWER`
- Role is read from User record, not user input

## Relationships

```
┌──────────┐       ┌──────────┐       ┌──────────┐
│  Tenant  │ 1───n │   User   │ 1───1 │ Session  │
└──────────┘       └──────────┘       └──────────┘
                        │
                        │ has
                        ▼
                   ┌──────────┐
                   │ JWT Token │
                   └──────────┘
```

- A Tenant has many Users
- A User has one active Session (JWT-based, stateless)
- The Session/JWT contains a reference to User and Tenant via claims
