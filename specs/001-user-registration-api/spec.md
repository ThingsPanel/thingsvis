# Feature Specification: User Registration API

**Feature Branch**: `001-user-registration-api`  
**Created**: 2026-01-22  
**Status**: Draft  
**Priority**: P0 (User onboarding)  
**Input**: User description: "用户需要能够注册账号。第一个注册的用户自动创建租户并成为 OWNER。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New User Registration (Priority: P1)

As a new user, I want to register with my email and password so that I can access the ThingsVis platform.

**Why this priority**: This is the fundamental user onboarding capability - without registration, no one can use the system. It's the entry point for all other features.

**Independent Test**: Can be fully tested by submitting registration form with valid email/password and verifying successful account creation with appropriate response.

**Acceptance Scenarios**:

1. **Given** a new user with valid email "user@example.com" and password "SecurePass123", **When** they submit the registration form, **Then** the system creates their account and returns user information (excluding password)
2. **Given** a new user with valid credentials, **When** registration completes successfully, **Then** they receive a confirmation with their user ID, email, name, role, and tenant ID
3. **Given** a registration request, **When** the password is hashed for storage, **Then** the hash is created using bcrypt with cost factor 12

---

### User Story 2 - First User Auto-Tenant Creation (Priority: P1)

As the very first user registering in the system, I want a tenant (workspace) to be automatically created for me so that I can immediately start using the platform as the owner.

**Why this priority**: Critical for initial platform adoption - the first user experience must be seamless without requiring manual tenant setup. Equal priority with registration as it's part of the same flow.

**Independent Test**: Can be tested by registering when no tenants exist and verifying both tenant creation and OWNER role assignment.

**Acceptance Scenarios**:

1. **Given** no existing tenants in the system, **When** the first user registers, **Then** a new tenant is automatically created with a default name based on the user's email
2. **Given** a newly created tenant for the first user, **When** the user account is created, **Then** the user is assigned the OWNER role for that tenant
3. **Given** the first user has registered, **When** viewing their profile, **Then** they see their role as "OWNER" and their tenant information

---

### User Story 3 - Join Existing Tenant (Priority: P2)

As a new user invited to join an existing organization, I want to register and be added to that organization's tenant so that I can collaborate with my team.

**Why this priority**: Important for team collaboration but secondary to initial user creation. Organizations need to onboard team members after the first user sets up the workspace.

**Independent Test**: Can be tested by registering with a valid tenant ID and verifying the user is added to that specific tenant.

**Acceptance Scenarios**:

1. **Given** an existing tenant with ID "tenant-123", **When** a new user registers with that tenantId, **Then** they are added to that tenant with VIEWER role
2. **Given** a registration request with a non-existent tenantId, **When** submitted, **Then** the system returns a 404 error indicating tenant not found
3. **Given** an existing tenant with 5 users, **When** a new user joins, **Then** they become the 6th user with VIEWER role (not OWNER)

---

### User Story 4 - Registration Validation (Priority: P2)

As a user, I want clear feedback when my registration data is invalid so that I can correct my input and successfully register.

**Why this priority**: Essential for user experience and data integrity, but operates as a supporting function to the core registration flow.

**Independent Test**: Can be tested by submitting various invalid inputs and verifying appropriate error responses.

**Acceptance Scenarios**:

1. **Given** a registration request with an already registered email, **When** submitted, **Then** the system returns a 400 error with message "Email already registered"
2. **Given** a registration request with password less than 8 characters, **When** submitted, **Then** the system returns a 400 error with message "Password must be at least 8 characters"
3. **Given** a registration request with invalid email format "notanemail", **When** submitted, **Then** the system returns a 400 error with message "Invalid email"

---

### Edge Cases

- **Empty request body**: System returns 400 error with validation details
- **Missing required fields**: System returns 400 error specifying which fields are missing
- **Email with leading/trailing whitespace**: System trims whitespace before validation and storage
- **Very long email or name**: System enforces reasonable length limits (email max 254 chars, name max 100 chars)
- **SQL injection attempts in email**: System properly sanitizes input through parameterized queries
- **Concurrent registrations with same email**: System handles race condition and only one registration succeeds
- **Database connection failure**: System returns 500 error with generic message (no sensitive details exposed)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept registration requests via POST endpoint at /api/v1/auth/register
- **FR-002**: System MUST validate email addresses using RFC 5322 compliant format checking
- **FR-003**: System MUST require passwords to be at least 8 characters in length
- **FR-004**: System MUST hash passwords using bcrypt with cost factor 12 before storage
- **FR-005**: System MUST create a new tenant automatically when the first user registers without specifying a tenantId
- **FR-006**: System MUST assign OWNER role to the first user in any tenant
- **FR-007**: System MUST assign VIEWER role to subsequent users joining an existing tenant
- **FR-008**: System MUST verify the existence of a tenant when tenantId is provided in registration
- **FR-009**: System MUST prevent duplicate email registrations
- **FR-010**: System MUST return user information in response excluding the password hash
- **FR-011**: System MUST return appropriate HTTP status codes (201 for success, 400 for validation errors, 404 for tenant not found, 500 for server errors)

### Key Entities

- **User**: Represents a registered user with email, hashed password, name, role, and tenant association. Each user belongs to exactly one tenant.
- **Tenant**: Represents an organization/workspace that contains users and their projects. Has a unique slug and configurable settings. Created automatically for the first user or referenced by subsequent users.

## Assumptions

- Email verification is not required for initial registration (can be added as a future enhancement)
- Users can only belong to one tenant at a time
- Default tenant naming convention uses the user's email prefix (e.g., "john" from "john@example.com" becomes "john's Workspace")
- Tenant slug is auto-generated using a timestamp-based pattern for uniqueness
- No rate limiting is implemented in this initial version (can be added as a future enhancement)
- The system uses existing Prisma schema for User and Tenant models

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete registration in under 3 seconds from form submission to response
- **SC-002**: 100% of valid registration requests result in successful account creation
- **SC-003**: 100% of invalid registration requests return appropriate error messages within 1 second
- **SC-004**: First-time users can register and receive OWNER status without any additional configuration steps
- **SC-005**: System correctly rejects duplicate email registrations 100% of the time
- **SC-006**: All stored passwords pass bcrypt verification when users attempt to log in
