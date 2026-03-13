import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth-helpers'

// Helper to parse dashboard JSON fields for response
function parseDashboard(dashboard: {
  canvasConfig: string
  nodes: string
  dataSources: string
  shareConfig?: string | null
  [key: string]: unknown
}) {
  return {
    ...dashboard,
    canvasConfig: JSON.parse(dashboard.canvasConfig || '{}'),
    nodes: JSON.parse(dashboard.nodes || '[]'),
    dataSources: JSON.parse(dashboard.dataSources || '[]'),
    shareConfig: dashboard.shareConfig ? JSON.parse(dashboard.shareConfig) : null,
  }
}

// GET /api/v1/dashboards/home - Get the dashboard marked as homepage
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find the dashboard with homeFlag = true for this tenant
  const dashboard = await prisma.dashboard.findFirst({
    where: {
      homeFlag: true,
      project: { tenantId: user.tenantId },
    },
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  })

  if (!dashboard) {
    return NextResponse.json({ data: null })
  }

  return NextResponse.json({ data: parseDashboard(dashboard) })
}
