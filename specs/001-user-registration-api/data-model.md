# Data Model: User Registration API

**Feature**: 001-user-registration-api  
**Date**: 2026-01-22

## Entities

### User (Existing - No Changes)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid | Unique identifier |
| email | String | UNIQUE, NOT NULL | User's email address |
| name | String | NULLABLE, max 100 | Display name |
| passwordHash | String | NULLABLE | bcrypt hash of password |
| role | String | NOT NULL, default "VIEWER" | OWNER, ADMIN, EDITOR, VIEWER |
| tenantId | String | FK -> Tenant.id | Associated tenant |
| createdAt | DateTime | NOT NULL, default now | Creation timestamp |
| updatedAt | DateTime | NOT NULL, auto | Last update timestamp |

**Relationships**:
- Belongs to one Tenant (tenantId -> Tenant.id)
- Cascade delete when Tenant is deleted

### Tenant (Existing - No Changes)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid | Unique identifier |
| name | String | NOT NULL | Workspace name |
| slug | String | UNIQUE, NOT NULL | URL-friendly identifier |
| plan | String | NOT NULL, default "FREE" | Subscription plan |
| settings | String | NOT NULL, default "{}" | JSON configuration |
| createdAt | DateTime | NOT NULL, default now | Creation timestamp |
| updatedAt | DateTime | NOT NULL, auto | Last update timestamp |

**Relationships**:
- Has many Users

## State Transitions

### User Registration Flow

```
[No User] 
    │
    ▼ POST /api/v1/auth/register
    │
    ├─── tenantId provided?
    │       │
    │       ├── YES: Verify tenant exists
    │       │         │
    │       │         ├── EXISTS: Count users in tenant
    │       │         │             │
    │       │         │             ├── 0 users: role = OWNER
    │       │         │             └── >0 users: role = VIEWER
    │       │         │
    │       │         └── NOT EXISTS: Return 404
    │       │
    │       └── NO: Create new tenant
    │                 └── role = OWNER (first user)
    │
    ▼
[User Created with role + tenantId]
```

### Role Assignment Rules

| Condition | Assigned Role |
|-----------|---------------|
| First user in new tenant (auto-created) | OWNER |
| First user joining existing tenant | OWNER |
| Subsequent user joining tenant | VIEWER |

## Validation Rules

### Registration Input

| Field | Rule | Error Message |
|-------|------|---------------|
| email | Required, valid email format | "Invalid email" |
| email | Unique across all users | "Email already registered" |
| email | Max 254 characters (RFC 5321) | "Invalid email" |
| password | Required, min 8 characters | "Password must be at least 8 characters" |
| name | Optional, max 100 characters | (Zod default) |
| tenantId | Optional, valid cuid format | (Zod default) |
| tenantId | Must exist if provided | "Tenant not found" |

### Password Storage

| Operation | Method |
|-----------|--------|
| Hash | bcrypt with cost factor 12 |
| Verify | bcrypt.compare() (handled by auth.ts) |

## Response Schemas

### Success Response (201)

```typescript
{
  id: string;        // cuid
  email: string;
  name: string | null;
  role: "OWNER" | "VIEWER";
  tenantId: string;  // cuid
  createdAt: string; // ISO 8601
}
```

### Error Responses

**400 - Validation Failed**
```typescript
{
  error: "Validation failed";
  details: {
    formErrors: string[];
    fieldErrors: {
      email?: string[];
      password?: string[];
      name?: string[];
      tenantId?: string[];
    }
  }
}
```

**400 - Duplicate Email**
```typescript
{
  error: "Email already registered"
}
```

**404 - Tenant Not Found**
```typescript
{
  error: "Tenant not found"
}
```

**500 - Server Error**
```typescript
{
  error: "Internal server error"
}
```

## Database Indexes

Existing indexes support this feature:

| Table | Index | Purpose |
|-------|-------|---------|
| users | email (UNIQUE) | Fast email lookup, enforce uniqueness |
| tenants | slug (UNIQUE) | URL-friendly tenant identification |
| users | tenantId | Fast user count per tenant |
