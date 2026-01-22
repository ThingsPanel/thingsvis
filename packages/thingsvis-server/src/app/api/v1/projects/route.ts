import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth-helpers'
import { CreateProjectSchema } from '@/lib/validators/project'

// GET /api/v1/projects - List projects with pagination
export async function GET(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))

  const where = { tenantId: user.tenantId }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { dashboards: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.project.count({ where }),
  ])

  return NextResponse.json({
    data: projects,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

// POST /api/v1/projects - Create a new project
export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const result = CreateProjectSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const project = await prisma.project.create({
    data: {
      ...result.data,
      tenantId: user.tenantId,
      createdById: user.id,
    },
  })

  return NextResponse.json(project, { status: 201 })
}
