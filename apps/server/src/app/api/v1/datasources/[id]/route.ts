import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'
import { z } from 'zod'

// Validation schema for update
const UpdateDataSourceSchema = z.object({
    name: z.string().optional(),
    type: z.enum(['STATIC', 'REST', 'WS', 'PLATFORM_FIELD']).optional(),
    config: z.any().optional(),
    transformation: z.any().optional()
})

type RouteContext = {
    params: Promise<{ id: string }>
}

/**
 * GET /api/v1/datasources/:id
 * Get a specific data source
 */
export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const user = await requireAuth(request)
        const { id } = await context.params

        const dataSource = await prisma.dataSource.findFirst({
            where: {
                id,
                userId: user.id,
                isDeleted: false
            }
        })

        if (!dataSource) {
            return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
        }

        return NextResponse.json({
            id: dataSource.id,
            name: dataSource.name,
            type: dataSource.type,
            config: JSON.parse(dataSource.config),
            transformation: dataSource.transformation ? JSON.parse(dataSource.transformation) : undefined,
            createdAt: dataSource.createdAt.toISOString(),
            updatedAt: dataSource.updatedAt.toISOString()
        })
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * PUT /api/v1/datasources/:id
 * Update a data source
 */
export async function PUT(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const user = await requireAuth(request)
        const { id } = await context.params
        const body = await request.json()

        const validation = UpdateDataSourceSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.flatten() },
                { status: 400 }
            )
        }

        // Check if data source exists and belongs to user
        const existing = await prisma.dataSource.findFirst({
            where: { id, userId: user.id, isDeleted: false }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
        }

        const { name, type, config, transformation } = validation.data

        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (type !== undefined) updateData.type = type
        if (config !== undefined) updateData.config = JSON.stringify(config)
        if (transformation !== undefined) {
            updateData.transformation = transformation ? JSON.stringify(transformation) : null
        }

        const dataSource = await prisma.dataSource.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json({
            id: dataSource.id,
            name: dataSource.name,
            type: dataSource.type,
            config: JSON.parse(dataSource.config),
            transformation: dataSource.transformation ? JSON.parse(dataSource.transformation) : undefined,
            createdAt: dataSource.createdAt.toISOString(),
            updatedAt: dataSource.updatedAt.toISOString()
        })
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * DELETE /api/v1/datasources/:id
 * Soft delete a data source
 */
export async function DELETE(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const user = await requireAuth(request)
        const { id } = await context.params

        // Check if data source exists and belongs to user
        const existing = await prisma.dataSource.findFirst({
            where: { id, userId: user.id, isDeleted: false }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
        }

        // Soft delete
        await prisma.dataSource.update({
            where: { id },
            data: { isDeleted: true }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
