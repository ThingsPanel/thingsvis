import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth-helpers'

// GET /api/v1/dashboards/[id]/thumbnail - Get dashboard thumbnail
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getSessionUser(request)
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const dashboard = await prisma.dashboard.findUnique({
        where: { id },
        select: { thumbnail: true, projectId: true }
    })

    if (!dashboard) {
        return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    // Verify access rights (same tenant)
    const project = await prisma.project.findUnique({
        where: { id: dashboard.projectId },
        select: { tenantId: true }
    })

    if (!project || project.tenantId !== user.tenantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ data: { thumbnail: dashboard.thumbnail } })
}
