import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth-helpers'
import { CreateDashboardSchema, DEFAULT_CANVAS_CONFIG } from '@/lib/validators/dashboard'

// Helper to parse dashboard JSON fields for response
function parseDashboardForResponse(dashboard: {
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

// GET /api/v1/dashboards - List dashboards with pagination
export async function GET(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))

  const where = {
    project: { tenantId: user.tenantId },
    ...(projectId && { projectId }),
  }

  const [dashboards, total] = await Promise.all([
    prisma.dashboard.findMany({
      where,
      select: {
        id: true,
        name: true,
        version: true,
        isPublished: true,
        projectId: true,
        createdAt: true,
        updatedAt: true,
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.dashboard.count({ where }),
  ])

  return NextResponse.json({
    data: dashboards,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

// POST /api/v1/dashboards - Create a new dashboard
export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const result = CreateDashboardSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const { projectId, canvasConfig, ...data } = result.data

  // Verify project belongs to user's tenant
  const project = await prisma.project.findFirst({
    where: { id: projectId, tenantId: user.tenantId },
  })

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const dashboard = await prisma.dashboard.create({
    data: {
      ...data,
      canvasConfig: JSON.stringify(canvasConfig || DEFAULT_CANVAS_CONFIG),
      nodes: '[]',
      dataSources: '[]',
      projectId,
      createdById: user.id,
    },
  })

  return NextResponse.json(parseDashboardForResponse(dashboard), { status: 201 })
}
