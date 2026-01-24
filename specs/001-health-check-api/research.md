# Research: Health Check API

**Feature**: Health Check API  
**Branch**: `001-health-check-api`  
**Date**: January 22, 2026

## Research Tasks

### 1. Next.js API Route Best Practices for Health Checks

**Decision**: Use Next.js App Router API route with `export const dynamic = 'force-dynamic'`

**Rationale**:
- Health checks must always run fresh (no caching)
- `force-dynamic` ensures the route is never statically optimized
- App Router provides cleaner async/await patterns vs Pages Router

**Alternatives Considered**:
- Pages Router (`pages/api/`) - Works but older pattern, project uses App Router
- Middleware-based health check - Overkill for a simple endpoint

### 2. Prisma Database Health Check Pattern

**Decision**: Use `prisma.$queryRaw\`SELECT 1\`` for connectivity check

**Rationale**:
- Lightest possible query to verify connectivity
- Works with all Prisma-supported databases (SQLite, PostgreSQL, MySQL)
- Returns immediately if connection is healthy
- Throws on connection failure, allowing proper error handling

**Alternatives Considered**:
- `prisma.$connect()` - Only checks if pool can be created, not if queries work
- `prisma.someModel.findFirst()` - Heavier, depends on having data in table
- Raw TCP socket check - Too low-level, doesn't verify Prisma layer

### 3. Version Information Retrieval

**Decision**: Read from `process.env.npm_package_version` with fallback to package.json version or "unknown"

**Rationale**:
- `npm_package_version` is automatically available when running via npm/pnpm scripts
- Falls back gracefully when env var not set (e.g., in Docker)
- "unknown" fallback ensures endpoint never fails due to version lookup

**Alternatives Considered**:
- Build-time injection - Requires build tooling changes
- Reading package.json at runtime - File I/O on every request is wasteful
- Hardcoded version - Requires manual updates, prone to drift

### 4. Response Structure Design

**Decision**: Use flat JSON structure with nested `checks` object for component statuses

**Rationale**:
- Common pattern in health check APIs (e.g., Spring Boot Actuator, AWS)
- `checks` object allows easy extension for future components
- Top-level `status` provides quick pass/fail for orchestrators

**Response Schema**:
```json
{
  "status": "healthy" | "unhealthy",
  "version": "0.1.0",
  "timestamp": "2026-01-22T10:00:00.000Z",
  "uptime": 12345.67,
  "checks": {
    "database": {
      "status": "healthy" | "unhealthy",
      "latency": 5,
      "error": "optional error message"
    }
  },
  "responseTime": 10
}
```

### 5. HTTP Status Code Mapping

**Decision**: 200 for healthy, 503 for unhealthy, 405 for non-GET methods

**Rationale**:
- 503 (Service Unavailable) is the standard for health check failures
- Load balancers expect 2xx for healthy, 5xx for unhealthy
- Docker HEALTHCHECK expects exit code based on HTTP status
- 405 clearly indicates method not supported (spec requirement FR-010)

**Alternatives Considered**:
- 500 for unhealthy - Less semantic, 503 is specifically "unavailable"
- 200 with body indicating unhealthy - Confuses infrastructure that only checks status code

### 6. Database Check Timeout Handling

**Decision**: Use Promise.race with 5-second timeout for database check

**Rationale**:
- Prevents health check from hanging if database is unresponsive
- 5 seconds is reasonable for detecting connectivity issues
- Reports "unhealthy" on timeout rather than waiting indefinitely

**Implementation Pattern**:
```typescript
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), ms)
    )
  ])
}
```

## Dependencies Confirmed

| Dependency | Version | Purpose |
|------------|---------|---------|
| next | ^15.0.0 | API route handling |
| @prisma/client | ^5.22.0 | Database connectivity check |

## No New Dependencies Required

The implementation uses only existing dependencies in the project.
