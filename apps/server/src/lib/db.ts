import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
    errorFormat: 'pretty',
    log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'warn', emit: 'event' },
    ],
})

if (!globalForPrisma.prisma) {
    // @ts-ignore
    prisma.$on('error', (e) => {
        logger.error({ msg: 'Prisma Client Error', dbError: e })
    })
    // @ts-ignore
    prisma.$on('warn', (e) => {
        logger.warn({ msg: 'Prisma Client Warning', dbWarn: e })
    })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
