import { prisma } from '../src/lib/prisma';

const LEAN_CARD_INCLUDES = {
  images: {
    orderBy: { sortOrder: 'asc' as const },
    take: 3,
  },
  destination: {
    select: {
      id: true,
      name: true,
      state: true,
      slug: true,
    },
  },
  category: {
    select: {
      id: true,
      slug: true,
      name: true,
    },
  },
  provider: {
    select: {
      id: true,
      businessName: true,
    },
  },
};

async function test() {
  await prisma.$queryRaw`SELECT 1`; // warm up

  console.log('Testing findMany with LEAN_CARD_INCLUDES (no availability)...');
  const t = performance.now();
  const res = await prisma.package.findMany({
    where: { status: 'PUBLISHED', approvalStatus: 'APPROVED', isActive: true },
    take: 6,
    include: LEAN_CARD_INCLUDES,
  });
  console.log(`Duration: ${(performance.now() - t).toFixed(2)} ms (Fetched ${res.length} records)`);
  await prisma.$disconnect();
}

test().catch(console.error);
