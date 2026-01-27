// 数据库初始化种子脚本
// 创建初始租户和测试用户

import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 开始数据库种子...')

    // 1. 创建默认租户
    console.log('📦 创建默认租户...')
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'default' },
        update: {},
        create: {
            name: 'Default Tenant',
            slug: 'default',
            plan: 'FREE',
            settings: JSON.stringify({
                allowPublicSharing: true,
                maxProjects: 10
            })
        }
    })
    console.log(`✅ 租户创建: ${tenant.name} (${tenant.id})`)

    // 2. 创建测试用户
    console.log('👤 创建测试用户...')
    const passwordHash = await hash('password123', 10)

    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@thingsvis.com' },
        update: {},
        create: {
            email: 'admin@thingsvis.com',
            name: 'Admin User',
            passwordHash,
            role: 'ADMIN',
            tenantId: tenant.id
        }
    })
    console.log(`✅ 管理员用户: ${adminUser.email}`)

    const testUser = await prisma.user.upsert({
        where: { email: 'test@thingsvis.com' },
        update: {},
        create: {
            email: 'test@thingsvis.com',
            name: 'Test User',
            passwordHash,
            role: 'EDITOR',
            tenantId: tenant.id
        }
    })
    console.log(`✅ 测试用户: ${testUser.email}`)

    // 3. 创建示例项目
    console.log('📁 创建示例项目...')
    const project = await prisma.project.upsert({
        where: { id: 'demo-project-001' },
        update: {},
        create: {
            id: 'demo-project-001',
            name: 'Demo Project',
            description: '示例项目，包含示例仪表板',
            tenantId: tenant.id,
            createdById: adminUser.id
        }
    })
    console.log(`✅ 项目创建: ${project.name}`)

    // 4. 创建示例Dashboard
    console.log('📊 创建示例仪表板...')
    const dashboard = await prisma.dashboard.create({
        data: {
            name: 'Demo Dashboard',
            version: 1,
            canvasConfig: JSON.stringify({
                mode: 'infinite',
                width: 1920,
                height: 1080,
                background: '#1a1a1a'
            }),
            nodes: JSON.stringify([
                {
                    id: 'text-node-1',
                    type: 'basic/text',
                    position: { x: 100, y: 100 },
                    size: { width: 200, height: 80 },
                    props: {
                        text: 'Welcome to ThingsVis!',
                        fontSize: 24,
                        color: '#ffffff'
                    }
                }
            ]),
            dataSources: JSON.stringify([]),
            projectId: project.id,
            createdById: adminUser.id
        }
    })
    console.log(`✅ 仪表板创建: ${dashboard.name}`)

    console.log('\n🎉 种子数据创建完成!\n')
    console.log('📋 测试账号:')
    console.log('  Email: admin@thingsvis.com or test@thingsvis.com')
    console.log('  Password: password123\n')
}

main()
    .catch((e) => {
        console.error('❌ 种子失败:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
