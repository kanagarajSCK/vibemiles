import { prisma } from '../src/lib/prisma';

async function main() {
  const destinations = await prisma.destination.findMany({
    orderBy: { name: 'asc' },
  });
  console.log(`Destinations in DB (${destinations.length}):`);
  destinations.forEach((d) => console.log(`- ${d.name} (${d.state || d.country || ''}), slug: ${d.slug}`));
}

main().finally(() => prisma.$disconnect());
