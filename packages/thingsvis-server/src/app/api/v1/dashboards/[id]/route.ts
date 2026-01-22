import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth-helpers'
import { UpdateDashboardSchema } from '@/lib/validators/dashboard'

type Params = { params: Promise<{ id: string }> }

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

// GET /api/v1/dashboards/:id - Get dashboard details with parsed JSON fields
export async function GET(request: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const dashboard = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: user.tenantId } },
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  })

  if (!dashboard) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
  }

  return NextResponse.json(parseDashboard(dashboard))
}

// PUT /api/v1/dashboards/:id - Update dashboard (creates version history)
export async function PUT(request: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const result = UpdateDashboardSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const existing = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: user.tenantId } },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
  }

  // Save version history before updating
  await prisma.dashboardVersion.create({
    data: {
      dashboardId: existing.id,
      version: existing.version,
      canvasConfig: existing.canvasConfig,
      nodes: existing.nodes,
      dataSources: existing.dataSources,
    },
  })

  // Prepare update data - only include fields that are provided
  const updateData: Record<string, unknown> = {
    version: { increment: 1 },
  }
  
  if (result.data.name !== undefined) {
    updateData.name = result.data.name
  }
  if (result.data.canvasConfig !== undefined) {
    updateData.canvasConfig = JSON.stringify(result.data.canvasConfig)
  }
  if (result.data.nodes !== undefined) {
    updateData.nodes = JSON.stringify(result.data.nodes)
  }
  if (result.data.dataSources !== undefined) {
    updateData.dataSources = JSON.stringify(result.data.dataSources)
  }

  const dashboard = await prisma.dashboard.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json(parseDashboard(dashboard))
}

// DELETE /api/v1/dashboards/:id - Delete dashboard (cascades to versions)
export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: user.tenantId } },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
  }

  await prisma.dashboard.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
