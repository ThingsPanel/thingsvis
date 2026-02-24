/**
 * Seed script — creates a default tenant + admin user for first deployment.
 * 
 * Usage:
 *   pnpm seed
 *   # or: npx tsx scripts/seed.ts
 * 
 * Default credentials:
 *   email:    admin@thingsvis.io
 *   password: admin123
 */

import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@thingsvis.io'
    const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin123'
    const name = process.env.SEED_ADMIN_NAME ?? 'Admin'

    // Check if admin already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
        console.log(`✅ Admin user "${email}" already exists, skipping seed.`)
        return
    }

    // Create default tenant
    const tenant = await prisma.tenant.create({
        data: {
            name: 'Default Workspace',
            slug: 'default',
        },
    })
    console.log(`✅ Created tenant: ${tenant.name} (${tenant.id})`)

    // Create admin user
    const passwordHash = await hash(password, 12)
    const user = await prisma.user.create({
        data: {
            email,
            name,
            passwordHash,
            role: 'OWNER',
            tenantId: tenant.id,
        },
    })
    console.log(`✅ Created admin user: ${user.email} (${user.id})`)
    console.log(`\n📝 Default credentials:`)
    console.log(`   Email:    ${email}`)
    console.log(`   Password: ${password}`)
    console.log(`\n⚠️  Please change the password after first login!`)
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
