import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth-helpers'

type Params = { params: Promise<{ id: string }> }

// POST /api/v1/dashboards/:id/set-homepage - Set dashboard as homepage
export async function POST(request: NextRequest, { params }: Params) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const dashboard = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: user.tenantId } },
    include: { project: true },
  })

  if (!dashboard) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
  }

  // Transaction: Clear other homepage flags in the same project, then set this one
  await prisma.$transaction([
    // Clear all homeFlag in the same project
    prisma.dashboard.updateMany({
      where: { projectId: dashboard.projectId },
      data: { homeFlag: false },
    }),
    // Set this dashboard as homepage
    prisma.dashboard.update({
      where: { id },
      data: { homeFlag: true },
    }),
  ])

  return NextResponse.json({
    id,
    homeFlag: true,
    message: 'Dashboard set as homepage',
  })
}

// DELETE /api/v1/dashboards/:id/set-homepage - Unset dashboard as homepage
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

  await prisma.dashboard.update({
    where: { id },
    data: { homeFlag: false },
  })

  return NextResponse.json({
    id,
    homeFlag: false,
    message: 'Homepage flag removed',
  })
}
