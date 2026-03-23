import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const LOCAL_AUTH_TYPE = 'LOCAL'

const prisma = new PrismaClient()

async function main() {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@thingsvis.io'
    const password = process.env.SEED_ADMIN_PASSWORD || 'admin123'
    const name = process.env.SEED_ADMIN_NAME || 'Admin'

    console.log(`🌱 Seeding database...`)

    // Upsert default tenant
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'default' },
        update: {},
        create: {
            name: 'Default Tenant',
            slug: 'default',
            plan: 'FREE',
        },
    })
    console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`)

    // Hash password
    const passwordHash = await hash(password, 12)

    // Upsert admin user
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash,
            name,
            role: 'OWNER',
            authType: LOCAL_AUTH_TYPE,
            displayEmail: email,
        },
        create: {
            email,
            displayEmail: email,
            name,
            passwordHash,
            role: 'OWNER',
            authType: LOCAL_AUTH_TYPE,
            tenantId: tenant.id,
        },
    })
    console.log(`✅ Admin user: ${user.email} (${user.id})`)
    console.log(`\n🎉 Seed complete! Login with:`)
    console.log(`   Email:    ${email}`)
    console.log(`   Password: ${password}`)
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
