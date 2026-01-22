# Feature Specification: Configure NextAuth.js for Authentication

**Feature Branch**: `001-nextauth-config`  
**Created**: January 22, 2026  
**Status**: Draft  
**Input**: User description: "需要实现用户认证系统，支持邮箱密码登录和 JWT session。为 ThingsPanel SSO 集成做准备。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Login with Email/Password (Priority: P1)

As a registered user, I want to log in using my email and password so that I can access my dashboards and projects securely.

**Why this priority**: Login is the gateway to all authenticated functionality. Without working login, users cannot access any protected resources. This is the foundation for all other authentication features.

**Independent Test**: Can be tested by entering valid credentials and verifying a JWT token is returned and session is established.

**Acceptance Scenarios**:

1. **Given** a registered user with email "user@example.com" and a valid password, **When** they submit login credentials via the login form, **Then** they receive a valid JWT session and are redirected to the dashboard.
2. **Given** a registered user, **When** they submit an incorrect password, **Then** they see an error message "Invalid credentials" and remain on the login page.
3. **Given** a non-existent email, **When** they attempt to log in, **Then** they see an error message "Invalid credentials" (same message for security).

---

### User Story 2 - Session Contains User Context (Priority: P1)

As a developer, I want the session to include user id, email, role, and tenantId so that I can implement authorization and multi-tenant isolation in API routes.

**Why this priority**: Session context is critical for authorization decisions and tenant isolation. Without proper session data, no protected API can function correctly.

**Independent Test**: Can be tested by logging in and inspecting the session object to verify it contains id, email, role, and tenantId fields.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** the session is accessed via server-side code, **Then** the session contains `id`, `email`, `role`, and `tenantId` properties.
2. **Given** a logged-in user with role "EDITOR" in tenant "tenant-123", **When** the session is accessed, **Then** `session.user.role` equals "EDITOR" and `session.user.tenantId` equals "tenant-123".

---

### User Story 3 - Protected API Routes (Priority: P2)

As a developer, I want API routes under `/api/v1/*` to be protected by authentication middleware so that unauthenticated requests are rejected.

**Why this priority**: API protection is essential for security but depends on having working authentication (P1 stories) first.

**Independent Test**: Can be tested by making an unauthenticated request to a protected endpoint and verifying a 401 response.

**Acceptance Scenarios**:

1. **Given** an unauthenticated request, **When** calling `GET /api/v1/projects`, **Then** the response is 401 Unauthorized with body `{ "error": "Unauthorized" }`.
2. **Given** an authenticated request with valid session, **When** calling `GET /api/v1/projects`, **Then** the request proceeds to the handler.
3. **Given** a request to `/api/v1/health` (public), **When** called without authentication, **Then** the request succeeds.
4. **Given** a request to `/api/auth/*`, **When** called without authentication, **Then** the request is allowed (auth routes are public).

---

### User Story 4 - Secure Password Storage (Priority: P1)

As a security-conscious user, I want my password to be securely hashed so that even if the database is compromised, my password is protected.

**Why this priority**: Security is non-negotiable for authentication. Passwords must never be stored in plain text.

**Independent Test**: Can be verified by inspecting the database to confirm passwords are stored as bcrypt hashes, not plain text.

**Acceptance Scenarios**:

1. **Given** a user registers with password "MySecurePass123", **When** the user record is created, **Then** the `passwordHash` field contains a bcrypt hash (starting with `$2a$` or `$2b$`).
2. **Given** a bcrypt hash in the database, **When** a login attempt is made with the correct password, **Then** bcrypt comparison succeeds and login proceeds.

---

### Edge Cases

- What happens when a user submits an empty email or password? → Validation error returned before authentication attempt.
- What happens when the database is unavailable during login? → Graceful error message without exposing internal details.
- What happens when JWT token expires? → Session is invalidated and user is redirected to login.
- What happens when a user's role or tenant changes after login? → Next request will use updated session data (JWT refresh on next auth check).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support email/password authentication using NextAuth.js v5 (Auth.js).
- **FR-002**: System MUST use JWT strategy for session management (not database sessions).
- **FR-003**: System MUST store passwords using bcrypt hashing with cost factor 12.
- **FR-004**: System MUST include `id`, `email`, `role`, and `tenantId` in the JWT token and session.
- **FR-005**: System MUST reject API requests to `/api/v1/*` routes without valid authentication (except explicitly public routes).
- **FR-006**: System MUST allow unauthenticated access to `/api/auth/*` routes (NextAuth.js routes).
- **FR-007**: System MUST allow unauthenticated access to `/api/v1/health` endpoint.
- **FR-008**: System MUST redirect unauthenticated users to `/login` page when accessing protected web pages.
- **FR-009**: System MUST validate credentials against user records stored via Prisma ORM.
- **FR-010**: System MUST return consistent error messages for invalid credentials (security: avoid revealing whether email exists).

### Key Entities

- **User**: Represents an authenticated user in the system. Key attributes: id, email, passwordHash, name, role, tenantId. Relationship: belongs to one Tenant.
- **Tenant**: Represents an organization or workspace. Used for multi-tenant isolation.
- **Session/JWT Token**: Represents the authenticated session. Contains user id, email, role, and tenantId for authorization decisions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the login process in under 3 seconds from form submission to dashboard access.
- **SC-002**: 100% of protected API requests without valid authentication return 401 status within 100ms.
- **SC-003**: Session data correctly includes user id, role, and tenantId for all authenticated requests.
- **SC-004**: Zero plain-text passwords stored in the database (all passwords are bcrypt hashed).
- **SC-005**: Authentication system is ready for future SSO integration (extensible provider architecture).

## Assumptions

- The Prisma schema with `User` and `Tenant` models already exists (from P0-2 Database task).
- The thingsvis-server package is initialized with Next.js 15 App Router (from P0-1 Setup task).
- Environment variables `AUTH_SECRET` and `AUTH_URL` will be configured in `.env`.
- The `/login` page will be implemented separately (this spec covers API/backend only).
- Default session expiry follows NextAuth.js defaults (30 days for JWT).

