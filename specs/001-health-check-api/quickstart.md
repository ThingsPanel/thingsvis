# Quickstart: Health Check API

**Feature**: Health Check API  
**Branch**: `001-health-check-api`  
**Date**: January 22, 2026

## Overview

This guide shows how to implement and test the health check endpoint.

## Prerequisites

- Node.js 20+
- pnpm installed
- Database configured (SQLite or PostgreSQL)

## Implementation Steps

### Step 1: Update Health Route

Update `packages/thingsvis-server/src/app/api/v1/health/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Timeout helper
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
    ),
  ])
}

export async function GET() {
  const startTime = Date.now()

  const checks: Record<string, { status: string; latency?: number; error?: string }> = {}

  // Database check with 5s timeout
  try {
    const dbStart = Date.now()
    await withTimeout(prisma.$queryRaw`SELECT 1`, 5000)
    checks.database = {
      status: 'healthy',
      latency: Date.now() - dbStart,
    }
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  const isHealthy = Object.values(checks).every((c) => c.status === 'healthy')

  const response = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    version: process.env.npm_package_version || '0.1.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
    responseTime: Date.now() - startTime,
  }

  return NextResponse.json(response, {
    status: isHealthy ? 200 : 503,
  })
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PATCH() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
```

### Step 2: Start the Server

```bash
cd packages/thingsvis-server
pnpm dev
```

### Step 3: Test the Endpoint

**Healthy Response:**
```bash
curl -i http://localhost:3001/api/v1/health
```

Expected output:
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "healthy",
  "version": "0.1.0",
  "timestamp": "2026-01-22T10:00:00.000Z",
  "uptime": 123.45,
  "checks": {
    "database": {
      "status": "healthy",
      "latency": 5
    }
  },
  "responseTime": 10
}
```

**Method Not Allowed:**
```bash
curl -i -X POST http://localhost:3001/api/v1/health
```

Expected output:
```
HTTP/1.1 405 Method Not Allowed
Content-Type: application/json

{
  "error": "Method not allowed"
}
```

## Docker Health Check Configuration

Add to `Dockerfile`:
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1
```

Or in `docker-compose.yml`:
```yaml
healthcheck:
  test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/v1/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## Monitoring Integration

### Prometheus (if using)

The health endpoint is suitable for simple up/down monitoring. For metrics scraping, consider adding a separate `/metrics` endpoint.

### Load Balancer Health Probes

Configure your load balancer to:
- Target: `/api/v1/health`
- Protocol: HTTP
- Port: 3000 (or your configured port)
- Healthy threshold: 2xx response
- Unhealthy threshold: 5xx response
- Interval: 30 seconds
- Timeout: 10 seconds

## Verification Checklist

- [ ] `GET /api/v1/health` returns 200 when database is connected
- [ ] Response includes `status`, `version`, `timestamp`, `uptime`, `checks`, `responseTime`
- [ ] `checks.database` shows `status: "healthy"` with `latency`
- [ ] POST/PUT/DELETE/PATCH return 405
- [ ] Stopping database causes 503 response with `status: "unhealthy"`
