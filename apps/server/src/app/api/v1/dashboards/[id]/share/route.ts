import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth-helpers'
import { ShareOptionsSchema, ShareConfig } from '@/lib/validators/share'

type Params = { params: Promise<{ id: string }> }

// POST /api/v1/dashboards/:id/share - Generate a share link
export async function POST(request: NextRequest, { params }: Params) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  // Validate request body
  const parseResult = ShareOptionsSchema.safeParse(body)
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parseResult.error.flatten() },
      { status: 400 }
    )
  }
  const options = parseResult.data

  const dashboard = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: user.tenantId } },
  })

  if (!dashboard) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
  }

  if (!dashboard.isPublished) {
    return NextResponse.json(
      { error: 'Dashboard must be published before sharing' },
      { status: 400 }
    )
  }

  // Generate or reuse existing share token
  const shareToken = dashboard.shareToken || `share_${nanoid(16)}`

  // Build share config
  const shareConfig: ShareConfig = {}
  if (options.password) {
    shareConfig.password = await bcrypt.hash(options.password, 10)
  }
  if (options.expiresIn) {
    shareConfig.expiresAt = new Date(Date.now() + options.expiresIn * 1000).toISOString()
  }

  await prisma.dashboard.update({
    where: { id },
    data: {
      shareToken,
      shareConfig: Object.keys(shareConfig).length > 0 ? JSON.stringify(shareConfig) : null,
    },
  })

  return NextResponse.json({
    shareToken,
    shareUrl: `/preview/${shareToken}`,
  })
}

// GET /api/v1/dashboards/:id/share - Get share link info
export async function GET(request: NextRequest, { params }: Params) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const dashboard = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: user.tenantId } },
    select: {
      id: true,
      shareToken: true,
      shareConfig: true,
      updatedAt: true,
    },
  })

  if (!dashboard) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
  }

  if (!dashboard.shareToken) {
    return NextResponse.json({
      shareToken: null,
      shareUrl: null,
      hasPassword: false,
      expiresAt: null,
    })
  }

  const shareConfig: ShareConfig | null = dashboard.shareConfig
    ? JSON.parse(dashboard.shareConfig)
    : null

  return NextResponse.json({
    shareToken: dashboard.shareToken,
    shareUrl: `/preview/${dashboard.shareToken}`,
    hasPassword: !!shareConfig?.password,
    expiresAt: shareConfig?.expiresAt || null,
    createdAt: dashboard.updatedAt,
  })
}

// DELETE /api/v1/dashboards/:id/share - Revoke share link
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
    data: {
      shareToken: null,
      shareConfig: null,
    },
  })

  return NextResponse.json({ success: true })
}
