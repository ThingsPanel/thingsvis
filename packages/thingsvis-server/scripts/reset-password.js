/**
 * Reset user password script
 * Usage: node scripts/reset-password.js <email> <new-password>
 */

const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('Usage: node scripts/reset-password.js <email> <new-password>');
    process.exit(1);
  }

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    // Hash new password
    const passwordHash = await hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    console.log(`✅ Password reset successfully for ${email}`);
    console.log(`   New password: ${newPassword}`);
    console.log(`   You can now login with these credentials.`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
