import { prisma } from '../src/lib/prisma';

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      customerProfile: { select: { id: true, fullName: true } },
      providerProfile: { select: { id: true, businessName: true } },
      sessions: { select: { id: true, expiresAt: true } },
    },
  });

  console.log(`Found ${users.length} users in database:`);
  for (const u of users) {
    console.log(`- [${u.role}] ID: ${u.id} | Email: ${u.email} | Phone: ${u.phone || 'none'} | Sessions: ${u.sessions.length}`);
  }
}

main().finally(() => prisma.$disconnect());
