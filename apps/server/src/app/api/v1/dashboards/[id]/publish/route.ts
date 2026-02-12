import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth-helpers'

type Params = { params: Promise<{ id: string }> }

// POST /api/v1/dashboards/:id/publish - Publish a dashboard
export async function POST(request: NextRequest, { params }: Params) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const dashboard = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: user.tenantId } },
  })

  if (!dashboard) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
  }

  const updated = await prisma.dashboard.update({
    where: { id },
    data: {
      isPublished: true,
      publishedAt: new Date(),
    },
  })

  return NextResponse.json({
    id: updated.id,
    isPublished: updated.isPublished,
    publishedAt: updated.publishedAt,
  })
}

// DELETE /api/v1/dashboards/:id/publish - Unpublish a dashboard
export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const dashboard = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: user.tenantId } },
  })

  if (!dashboard) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
  }

  // Unpublish and invalidate all share links
  const updated = await prisma.dashboard.update({
    where: { id },
    data: {
      isPublished: false,
      publishedAt: null,
      shareToken: null,
      shareConfig: null,
    },
  })

  return NextResponse.json({
    id: updated.id,
    isPublished: updated.isPublished,
    publishedAt: updated.publishedAt,
  })
}
