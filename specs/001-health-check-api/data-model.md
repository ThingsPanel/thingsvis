# Data Model: Health Check API

**Feature**: Health Check API  
**Branch**: `001-health-check-api`  
**Date**: January 22, 2026

## Overview

This feature does not persist data. All entities are transient response structures.

## Entities

### HealthResponse

Represents the complete health check response returned by the API.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | `"healthy" \| "unhealthy"` | Yes | Overall health status |
| version | `string` | Yes | Application version (e.g., "0.1.0") |
| timestamp | `string` (ISO 8601) | Yes | When the check was performed |
| uptime | `number` | Yes | Server uptime in seconds |
| checks | `Record<string, ComponentCheck>` | Yes | Individual component check results |
| responseTime | `number` | Yes | Total response time in milliseconds |

### ComponentCheck

Represents the health status of an individual component (e.g., database).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | `"healthy" \| "unhealthy"` | Yes | Component health status |
| latency | `number` | No | Check latency in milliseconds (only if healthy) |
| error | `string` | No | Error message (only if unhealthy) |

## TypeScript Interfaces

```typescript
interface ComponentCheck {
  status: 'healthy' | 'unhealthy'
  latency?: number
  error?: string
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy'
  version: string
  timestamp: string
  uptime: number
  checks: Record<string, ComponentCheck>
  responseTime: number
}
```

## State Transitions

### Overall Health Status

```
┌─────────────┐
│   healthy   │ ←── All component checks pass
└─────────────┘
       │
       │ Any component check fails
       ▼
┌─────────────┐
│  unhealthy  │ ←── At least one component check fails
└─────────────┘
```

### Component Check Status

```
┌─────────────┐
│   healthy   │ ←── Check completes successfully within timeout
└─────────────┘
       │
       │ Check throws error OR timeout
       ▼
┌─────────────┐
│  unhealthy  │ ←── Check fails or times out
└─────────────┘
```

## Validation Rules

1. **status**: Must be exactly `"healthy"` or `"unhealthy"`
2. **version**: Non-empty string, defaults to `"unknown"` if unavailable
3. **timestamp**: Valid ISO 8601 format
4. **uptime**: Non-negative number
5. **responseTime**: Non-negative number
6. **checks.database**: Must be present in all responses

## Relationships

- `HealthResponse.status` is derived from `ComponentCheck.status` values
  - If ALL component statuses are "healthy" → HealthResponse.status = "healthy"
  - If ANY component status is "unhealthy" → HealthResponse.status = "unhealthy"

## No Database Schema Changes

This feature does not require any database schema changes. The health check reads from the database but does not write to it.
