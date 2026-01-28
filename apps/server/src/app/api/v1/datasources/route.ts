import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'
import { z } from 'zod'

// Validation schema
const DataSourceSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['STATIC', 'REST', 'WS', 'PLATFORM_FIELD']),
    config: z.any(), // JSON object
    transformation: z.any().optional() // JSON object
})

/**
 * GET /api/v1/datasources
 * Get all data sources for the authenticated user
 */
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth(request)

        const dataSources = await prisma.dataSource.findMany({
            where: {
                userId: user.id,
                isDeleted: false
            },
            orderBy: { updatedAt: 'desc' }
        })

        // Parse JSON fields
        const parsed = dataSources.map(ds => ({
            id: ds.id,
            name: ds.name,
            type: ds.type,
            config: JSON.parse(ds.config),
            transformation: ds.transformation ? JSON.parse(ds.transformation) : undefined,
            createdAt: ds.createdAt.toISOString(),
            updatedAt: ds.updatedAt.toISOString()
        }))

        return NextResponse.json(parsed)
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/v1/datasources
 * Create a new data source
 */
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth(request)
        const body = await request.json()

        const validation = DataSourceSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.flatten() },
                { status: 400 }
            )
        }

        const { id, name, type, config, transformation } = validation.data

        // Check if data source with this ID already exists for this user
        const existing = await prisma.dataSource.findFirst({
            where: { id, userId: user.id }
        })

        if (existing) {
            return NextResponse.json(
                { error: 'Data source with this ID already exists' },
                { status: 409 }
            )
        }

        const dataSource = await prisma.dataSource.create({
            data: {
                id,
                name,
                type,
                config: JSON.stringify(config),
                transformation: transformation ? JSON.stringify(transformation) : null,
                userId: user.id
            }
        })

        return NextResponse.json({
            id: dataSource.id,
            name: dataSource.name,
            type: dataSource.type,
            config: JSON.parse(dataSource.config),
            transformation: dataSource.transformation ? JSON.parse(dataSource.transformation) : undefined,
            createdAt: dataSource.createdAt.toISOString(),
            updatedAt: dataSource.updatedAt.toISOString()
        }, { status: 201 })
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
