const { PrismaClient } = require('@prisma/client');
const { compare } = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    const email = 'mr_zhaojie@126.com';
    const password = '12345678';

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('❌ User not found:', email);
      process.exit(1);
    }

    console.log('✅ User found:', user.email);
    console.log('   Name:', user.name);
    console.log('   Has password hash:', !!user.passwordHash);
    console.log('   Password hash length:', user.passwordHash?.length);

    const isValid = await compare(password, user.passwordHash);
    console.log('   Password test result:', isValid ? '✅ VALID' : '❌ INVALID');

    if (!isValid) {
      console.log('\n❌ Password does not match!');
      console.log('   Please check if the password is correct.');
    } else {
      console.log('\n✅ Login should work with these credentials!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
