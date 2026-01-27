// 快速测试登录API的脚本
import { hash } from 'bcryptjs'

async function testLogin() {
    const testPassword = 'password123'
    const testHash = await hash(testPassword, 10)

    console.log('🔐 密码加密测试')
    console.log('原始密码:', testPassword)
    console.log('生成Hash:', testHash)

    // 测试登录请求
    const loginData = {
        email: 'admin@thingsvis.com',
        password: testPassword
    }

    console.log('\n📤 发送登录请求...')
    console.log('请求数据:', JSON.stringify(loginData, null, 2))

    try {
        const response = await fetch('http://localhost:3001/api/v1/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        })

        console.log('\n📥 响应状态:', response.status, response.statusText)

        const data = await response.json()
        console.log('响应数据:', JSON.stringify(data, null, 2))

        if (response.ok) {
            console.log('\n✅ 登录成功!')
        } else {
            console.log('\n❌ 登录失败')
        }
    } catch (error) {
        console.error('\n❌ 请求失败:', error)
    }
}

testLogin()
