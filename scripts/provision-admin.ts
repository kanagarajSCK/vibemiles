import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function provisionAdmin() {
  console.log('=== VIBEMILES ADMIN PROVISIONING UTILITY ===\n');

  // Parse arguments
  const args = process.argv.slice(2);
  let email = process.env.ADMIN_EMAIL;
  let password = process.env.ADMIN_PASSWORD;
  const isForce = args.includes('--force');

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      email = args[i + 1];
    }
    if (args[i] === '--password' && args[i + 1]) {
      password = args[i + 1];
    }
  }

  if (!email || !password) {
    console.error('❌ Error: Missing credentials.');
    console.error('Usage via CLI args:');
    console.error('  npx tsx scripts/provision-admin.ts --email admin@example.com --password YourSecurePassword123! [--force]');
    console.error('Usage via environment variables:');
    console.error('  ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="YourSecurePassword123!" npx tsx scripts/provision-admin.ts [--force]');
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    console.error('❌ Error: Invalid email format.');
    process.exit(1);
  }

  // Validate password length
  if (password.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters long for an admin account.');
    process.exit(1);
  }

  try {
    // 1. Check existing admin accounts
    const existingAdminCount = await prisma.user.count({
      where: { role: UserRole.ADMIN },
    });

    const targetUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingAdminCount > 0 && !isForce) {
      if (targetUser && targetUser.role === UserRole.ADMIN) {
        console.warn(`⚠️  Admin account already exists for ${normalizedEmail}.`);
        console.warn('   To safely update this admin account password, re-run with --force.');
        process.exit(0);
      }
    }

    // Safety: Do not automatically promote an existing non-admin user unless --force is given
    if (targetUser && targetUser.role !== UserRole.ADMIN && !isForce) {
      console.error(`❌ Refused: User ${normalizedEmail} currently has role '${targetUser.role}'.`);
      console.error('   To explicitly change this user to ADMIN, pass the --force flag.');
      process.exit(1);
    }

    // Hash password with 12 bcrypt rounds
    const passwordHash = await bcrypt.hash(password, 12);

    let resultUser;
    if (targetUser) {
      resultUser = await prisma.user.update({
        where: { id: targetUser.id },
        data: {
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          passwordHash,
        },
      });
      console.log('✅ Admin account updated successfully.');
    } else {
      resultUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        },
      });
      console.log('✅ New Admin account provisioned successfully.');
    }

    console.log(`   User ID : ${resultUser.id}`);
    console.log(`   Email   : ${resultUser.email}`);
    console.log(`   Role    : ${resultUser.role}`);
    console.log(`   Status  : ${resultUser.status}`);
    console.log('   Password: [REDACTED — Hashed with bcrypt 12 rounds]');
  } catch (error) {
    console.error('❌ Provisioning failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

provisionAdmin();
