import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth-helpers'
import { UpdateProjectSchema } from '@/lib/validators/project'

type Params = { params: Promise<{ id: string }> }

// GET /api/v1/projects/:id - Get project details
export async function GET(request: NextRequest, { params }: Params) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const project = await prisma.project.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      dashboards: { select: { id: true, name: true, isPublished: true } },
    },
  })

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  return NextResponse.json(project)
}

// PUT /api/v1/projects/:id - Update project
export async function PUT(request: NextRequest, { params }: Params) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const result = UpdateProjectSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const existing = await prisma.project.findFirst({
    where: { id, tenantId: user.tenantId },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const project = await prisma.project.update({
    where: { id },
    data: result.data,
  })

  return NextResponse.json(project)
}

// DELETE /api/v1/projects/:id - Delete project (cascades to dashboards)
export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.project.findFirst({
    where: { id, tenantId: user.tenantId },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  await prisma.project.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
