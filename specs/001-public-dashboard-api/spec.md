# Feature Specification: Public Dashboard Access API

**Feature Branch**: `001-public-dashboard-api`  
**Created**: January 22, 2026  
**Status**: Draft  
**Priority**: P0 (Sharing functionality)  
**Input**: User description: "Users need to share dashboards with unauthenticated users via shareToken for accessing published dashboards"

## Problem Statement

Users need the ability to share dashboards with external visitors who do not have accounts in the system. This enables dashboard creators to publish their work and distribute shareable links that allow anyone to view the dashboard without requiring authentication.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Publish Dashboard for Sharing (Priority: P1)

As a dashboard owner, I want to publish my dashboard so that it becomes available for public sharing. Publishing is the prerequisite for generating share links.

**Why this priority**: Publishing is the foundational step that must occur before any sharing can happen. Without publishing, dashboards cannot be shared publicly.

**Independent Test**: Can be fully tested by publishing a dashboard and verifying its published state changes, delivering the core capability to make content shareable.

**Acceptance Scenarios**:

1. **Given** I am an authenticated user with a dashboard I own, **When** I request to publish the dashboard, **Then** the dashboard status changes to "published" and I receive a confirmation.
2. **Given** I am an authenticated user with an already published dashboard, **When** I request to unpublish the dashboard, **Then** the dashboard status changes to "draft" and all existing share links become invalid.
3. **Given** I am an authenticated user, **When** I try to publish a dashboard I don't own, **Then** I receive an authorization error.

---

### User Story 2 - Generate Share Link (Priority: P1)

As a dashboard owner, I want to generate a shareable link for my published dashboard so that I can distribute it to visitors who need to view the dashboard.

**Why this priority**: Share link generation is the core mechanism for distribution. This, combined with publishing, forms the minimum viable sharing experience.

**Independent Test**: Can be fully tested by generating a share link for a published dashboard and verifying the link structure is valid and associated with the dashboard.

**Acceptance Scenarios**:

1. **Given** I am an authenticated user with a published dashboard, **When** I request to generate a share link, **Then** I receive a unique share token and the full shareable URL.
2. **Given** I am an authenticated user with a published dashboard, **When** I generate a share link with an expiration time, **Then** the share link includes the specified expiration.
3. **Given** I am an authenticated user with a published dashboard, **When** I generate a share link with password protection, **Then** the share link is created with the encrypted password requirement.
4. **Given** I am an authenticated user with an unpublished dashboard, **When** I try to generate a share link, **Then** I receive an error indicating the dashboard must be published first.

---

### User Story 3 - View Shared Dashboard as Visitor (Priority: P1)

As a visitor without an account, I want to view a shared dashboard using the share link so that I can access the dashboard content without logging in.

**Why this priority**: This is the end-user experience that fulfills the entire sharing workflow. Visitors are the primary consumers of shared content.

**Independent Test**: Can be fully tested by accessing a valid share link and verifying the dashboard data is returned without authentication.

**Acceptance Scenarios**:

1. **Given** I have a valid share token for a published dashboard, **When** I access the public dashboard endpoint, **Then** I receive the complete dashboard data for rendering.
2. **Given** I have a valid share token for a password-protected dashboard, **When** I access the endpoint with the correct password in the header, **Then** I receive the dashboard data.
3. **Given** I have a valid share token for a password-protected dashboard, **When** I access the endpoint without a password or with an incorrect password, **Then** I receive an authentication error.
4. **Given** I have an expired share token, **When** I access the public dashboard endpoint, **Then** I receive an error indicating the link has expired.
5. **Given** I have a share token for an unpublished dashboard, **When** I access the public dashboard endpoint, **Then** I receive an error indicating the dashboard is not available.

---

### User Story 4 - Manage Share Links (Priority: P2)

As a dashboard owner, I want to view and revoke existing share links so that I can control access to my shared dashboards.

**Why this priority**: Management capabilities are important for security and control but are secondary to the core publish-share-view workflow.

**Independent Test**: Can be fully tested by listing share links for a dashboard and revoking specific links, verifying they no longer work.

**Acceptance Scenarios**:

1. **Given** I am an authenticated user with a dashboard that has share links, **When** I request to list all share links, **Then** I receive a list of all active share links with their properties (creation date, expiration, password status).
2. **Given** I am an authenticated user with a dashboard share link, **When** I revoke a specific share link, **Then** the share token becomes invalid and visitors can no longer access the dashboard via that link.

---

### Edge Cases

- What happens when a visitor accesses a share link for a deleted dashboard? → Return "dashboard not found" error.
- What happens when a user tries to share a dashboard they can view but don't own? → Return authorization error; only owners can generate share links.
- What happens when multiple share links exist for the same dashboard and one is revoked? → Only the revoked link becomes invalid; other links remain active.
- What happens when a share link expires while a visitor is viewing? → The initial load succeeds; subsequent data refreshes will fail with expiration error.
- What happens when the dashboard owner's account is deactivated? → Existing share links remain valid until explicitly revoked or expired (content persists independently of owner status).

## Requirements *(mandatory)*

### Functional Requirements

#### Dashboard Publishing

- **FR-001**: System MUST allow authenticated dashboard owners to publish their dashboards.
- **FR-002**: System MUST allow authenticated dashboard owners to unpublish their dashboards.
- **FR-003**: System MUST invalidate all share links when a dashboard is unpublished.
- **FR-004**: System MUST track and persist the published/draft status of each dashboard.

#### Share Link Generation

- **FR-005**: System MUST generate unique, cryptographically secure share tokens for published dashboards.
- **FR-006**: System MUST allow setting an optional expiration time when generating share links.
- **FR-007**: System MUST allow setting an optional password when generating share links.
- **FR-008**: System MUST securely hash passwords before storing them (never store plaintext).
- **FR-009**: System MUST reject share link generation requests for unpublished dashboards.
- **FR-010**: System MUST allow multiple active share links per dashboard.

#### Public Access

- **FR-011**: System MUST serve dashboard data to visitors with valid share tokens without requiring authentication.
- **FR-012**: System MUST validate password via `X-Share-Password` header for password-protected shares.
- **FR-013**: System MUST reject access to expired share links with appropriate error messaging.
- **FR-014**: System MUST reject access to share links for unpublished or deleted dashboards.
- **FR-015**: System MUST return complete dashboard data including layout, widgets, and configuration for rendering.

#### Share Link Management

- **FR-016**: System MUST allow dashboard owners to list all active share links for their dashboards.
- **FR-017**: System MUST allow dashboard owners to revoke specific share links.
- **FR-018**: System MUST immediately invalidate revoked share links.

#### Authorization

- **FR-019**: System MUST verify user ownership before allowing publish/unpublish operations.
- **FR-020**: System MUST verify user ownership before allowing share link generation or management.

### Key Entities

- **Dashboard**: The visual display being shared; has a publication status (published/draft), owned by a user, contains layout and widget configurations.
- **ShareLink**: Represents a shareable access grant; contains share token, associated dashboard reference, optional expiration timestamp, optional password hash, creation timestamp, active status.
- **ShareToken**: A unique, URL-safe identifier used in public URLs to access shared dashboards.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can publish a dashboard and generate a share link in under 30 seconds.
- **SC-002**: Visitors can load a shared dashboard within 3 seconds of accessing the share link.
- **SC-003**: 100% of expired share links correctly deny access with appropriate error messages.
- **SC-004**: 100% of password-protected share links correctly enforce password validation.
- **SC-005**: Users can successfully share dashboards with external visitors without requiring them to create accounts.
- **SC-006**: Dashboard owners can revoke any share link and access is denied within 1 minute of revocation.
- **SC-007**: System supports at least 100 concurrent visitors accessing shared dashboards without degradation.

## Assumptions

- Dashboards already exist in the system with CRUD operations implemented (depends on dashboards-crud-api).
- User authentication is already implemented and users have ownership relationships with dashboards.
- The dashboard data structure is complete enough to render the dashboard on the client side.
- Standard web security practices (HTTPS) are in place for protecting passwords in transit.
- Share tokens will use URL-safe encoding (e.g., base64url) for compatibility with URL paths.
- Password protection uses industry-standard hashing (e.g., bcrypt) - specific algorithm choice is an implementation detail.
- Expiration times are stored and compared in UTC to avoid timezone issues.

## Out of Scope

- Analytics/tracking of share link usage (views, unique visitors).
- Embedding dashboards in iframes on external sites.
- Fine-grained permissions on shared dashboards (e.g., allowing some widgets to be hidden).
- Sharing with specific users or groups (this feature is specifically for public/anonymous access).
- Rate limiting for public access endpoints (should be handled at infrastructure level).
- Customizable share link URLs or vanity URLs.
