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
      
      process.exit(1);
    }

    
    
    
    

    const isValid = await compare(password, user.passwordHash);
    

    if (!isValid) {
      
      
    } else {
      
    }
  } catch (error) {
    
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
