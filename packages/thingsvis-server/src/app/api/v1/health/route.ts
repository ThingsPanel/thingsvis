import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Prevent caching - health checks must always run fresh
export const dynamic = 'force-dynamic'

// Timeout helper for database checks
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

  // Database connectivity check with 5s timeout
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

  // Determine overall health status
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

// Handle unsupported methods - return 405 Method Not Allowed
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
