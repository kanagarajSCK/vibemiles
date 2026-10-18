import { prisma } from '../src/lib/prisma';
import { hashPassword, verifyPassword } from '../src/server/auth/password';

async function main() {
  const email = 'realkanagaraj@gmail.com';
  const user = await prisma.user.findFirst({
    where: { email },
    include: {
      providerProfile: {
        include: { documents: true, packages: true },
      },
    },
  });

  console.log('User found:', user ? {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    hasPasswordHash: !!user.passwordHash,
    providerProfile: user.providerProfile ? {
      id: user.providerProfile.id,
      businessName: user.providerProfile.businessName,
      verificationStatus: user.providerProfile.verificationStatus,
      packagesCount: user.providerProfile.packages.length,
      docsCount: user.providerProfile.documents.length,
    } : null,
  } : 'NOT FOUND');

  if (user && user.passwordHash) {
    const isPassValid = await verifyPassword('realkanagaraj@gmail.com', user.passwordHash);
    console.log('Password check ("realkanagaraj@gmail.com"):', isPassValid);
  }

  // Also list categories and destinations
  const categories = await prisma.category.findMany({ select: { id: true, name: true, slug: true } });
  console.log('Categories count:', categories.length, categories.map(c => c.name));

  const destinations = await prisma.destination.findMany({ select: { id: true, name: true, slug: true, state: true } });
  console.log('Destinations count:', destinations.length, destinations.map(d => `${d.name} (${d.state})`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
