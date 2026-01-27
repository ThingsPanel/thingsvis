// 数据库用户诊断脚本
import { PrismaClient } from '@prisma/client'
import { compare } from 'bcryptjs'

const prisma = new PrismaClient()

async function diagnoseUsers() {
    console.log('🔍 数据库用户诊断\n')

    try {
        // 查询所有用户
        const users = await prisma.user.findMany({
            include: { tenant: true }
        })

        console.log(`📊 总共有 ${users.length} 个用户：\n`)

        for (const user of users) {
            console.log('👤 用户信息:')
            console.log(`  ID: ${user.id}`)
            console.log(`  邮箱: ${user.email}`)
            console.log(`  姓名: ${user.name || '(无)'}`)
            console.log(`  角色: ${user.role}`)
            console.log(`  租户: ${user.tenant?.name || '未知'}`)
            console.log(`  密码哈希: ${user.passwordHash?.substring(0, 20)}...`)
            console.log(`  创建时间: ${user.createdAt}`)

            // 测试密码验证
            if (user.passwordHash) {
                const testPassword = 'password123'
                const isValid = await compare(testPassword, user.passwordHash)
                console.log(`  ✅ 测试密码 "${testPassword}": ${isValid ? '✓ 正确' : '✗ 错误'}`)

                // 如果是新注册的用户，提示可能的密码
                if (!isValid) {
                    console.log(`  ℹ️  这可能是新注册的用户，请使用注册时的密码`)
                }
            } else {
                console.log(`  ⚠️  警告: 此用户没有密码哈希!`)
            }

            console.log('')
        }

        console.log('\n💡 建议:')
        console.log('1. 请访问 http://localhost:5555 查看Prisma Studio中的完整数据')
        console.log('2. 如果找不到您注册的用户，可能注册时出了问题')
        console.log('3. 使用种子数据中的测试账号:')
        console.log('   - admin@thingsvis.com / password123')
        console.log('   - test@thingsvis.com / password123')

    } catch (error) {
        console.error('❌ 诊断失败:', error)
    } finally {
        await prisma.$disconnect()
    }
}

diagnoseUsers()
