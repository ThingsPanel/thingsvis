import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { ShareConfig } from '@/lib/validators/share'

type Params = { params: Promise<{ token: string }> }

// GET /api/v1/public/dashboard/:token - Get public dashboard data
export async function GET(request: NextRequest, { params }: Params) {
  const { token } = await params

  const dashboard = await prisma.dashboard.findFirst({
    where: {
      shareToken: token,
      isPublished: true,
    },
    select: {
      id: true,
      name: true,
      canvasConfig: true,
      nodes: true,
      dataSources: true,
      shareConfig: true,
    },
  })

  if (!dashboard) {
    return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
  }

  // Parse share config for validation
  const shareConfig: ShareConfig | null = dashboard.shareConfig
    ? JSON.parse(dashboard.shareConfig)
    : null

  // Check expiration
  if (shareConfig?.expiresAt && new Date(shareConfig.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Share link expired' }, { status: 410 })
  }

  // Check password if required
  if (shareConfig?.password) {
    const providedPassword = request.headers.get('X-Share-Password')
    if (!providedPassword) {
      return NextResponse.json(
        { error: 'Password required', requirePassword: true },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(providedPassword, shareConfig.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid password', requirePassword: true },
        { status: 401 }
      )
    }
  }

  // Return only public-safe dashboard fields
  return NextResponse.json({
    id: dashboard.id,
    name: dashboard.name,
    canvasConfig: JSON.parse(dashboard.canvasConfig || '{}'),
    nodes: JSON.parse(dashboard.nodes || '[]'),
    dataSources: JSON.parse(dashboard.dataSources || '[]'),
  })
}
