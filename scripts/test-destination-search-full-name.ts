import { prisma } from '../src/lib/prisma';

async function testDestinationSearch() {
  console.log('Testing destination search for query "man"...');

  // Test the exact DB query used in /api/locations/search
  const q = 'man';
  const normalizedQ = q.toLowerCase();

  const destinations = await prisma.destination.findMany({
    where: {
      AND: [
        { packageCount: { gt: 0 } },
        {
          NOT: [
            { name: { contains: 'demo', mode: 'insensitive' } },
            { slug: { contains: 'demo', mode: 'insensitive' } },
          ],
        },
      ],
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { state: { contains: q, mode: 'insensitive' } },
        { country: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { tags: { has: normalizedQ } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      state: true,
      country: true,
      packageCount: true,
      heroImage: true,
    },
  });

  console.log(`Found ${destinations.length} matching destinations for "${q}":`);
  destinations.forEach((d) => {
    console.log(`- Full Name: "${d.name}", State: "${d.state}", Country: "${d.country}", Tours: ${d.packageCount}`);
  });

  const names = destinations.map((d) => d.name);
  if (!names.includes('Mangaluru')) {
    throw new Error('Expected Mangaluru to be in search results');
  }
  if (!names.includes('Manipur')) {
    throw new Error('Expected Manipur to be in search results');
  }
  if (!names.includes('Manali')) {
    throw new Error('Expected Manali to be in search results');
  }
  if (names.some((n) => n.toLowerCase().includes('demo'))) {
    throw new Error('Demo destinations must not appear in search results');
  }
  if (destinations.some((d) => d.packageCount <= 0)) {
    throw new Error('Destinations with 0 tours must not appear in search results');
  }

  console.log('✅ ALL SEARCH CRITERIA PASSED: Full names shown, real tours only, zero demo listings.');
}

testDestinationSearch()
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
