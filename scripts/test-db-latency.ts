import { prisma } from '../src/lib/prisma';
import { PACKAGE_CARD_INCLUDES } from '../src/server/db/packages';

async function test() {
  console.log('--- 1. Testing Single Query (SELECT 1) Round-Trip ---');
  for (let i = 1; i <= 3; i++) {
    const start = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const dur = performance.now() - start;
    console.log(`Ping ${i}: ${dur.toFixed(2)} ms`);
  }

  console.log('\n--- 2. Testing Simple findMany (No Relations) ---');
  const startSimple = performance.now();
  const simple = await prisma.package.findMany({
    where: { status: 'PUBLISHED', approvalStatus: 'APPROVED', isActive: true },
    take: 6,
    select: { id: true, name: true, slug: true, finalPrice: true },
  });
  console.log(`Simple findMany (6 records, no includes): ${(performance.now() - startSimple).toFixed(2)} ms`);

  console.log('\n--- 3. Testing findMany WITH PACKAGE_CARD_INCLUDES ---');
  const startFull = performance.now();
  const full = await prisma.package.findMany({
    where: { status: 'PUBLISHED', approvalStatus: 'APPROVED', isActive: true },
    take: 6,
    include: PACKAGE_CARD_INCLUDES,
  });
  console.log(`Full findMany (6 records, with includes): ${(performance.now() - startFull).toFixed(2)} ms`);

  console.log('\n--- 4. Testing Single SQL Query with JSON aggregations/JOINs ---');
  const startSql = performance.now();
  const rawSql = await prisma.$queryRaw`
    SELECT 
      p.id, p.slug, p.name, p."finalPrice", p."basePrice", p."discountPercent",
      p."durationDays", p."durationNights", p."maxGroupSize", p.rating, p."reviewCount",
      d.name as "destinationName", d.state,
      c.name as "categoryName", c.slug as "categorySlug",
      prov."businessName" as "providerName",
      (
        SELECT COALESCE(json_agg(img.url ORDER BY img."sortOrder"), '[]'::json)
        FROM "PackageImage" img
        WHERE img."packageId" = p.id
      ) as images
    FROM "Package" p
    LEFT JOIN "Destination" d ON d.id = p."destinationId"
    LEFT JOIN "Category" c ON c.id = p."categoryId"
    LEFT JOIN "ProviderProfile" prov ON prov.id = p."providerId"
    WHERE p.status = 'PUBLISHED'::"ListingStatus" 
      AND p."approvalStatus" = 'APPROVED'::"ApprovalStatus" 
      AND p."isActive" = true
    ORDER BY p."isFeatured" DESC, p.rating DESC
    LIMIT 6;
  `;
  console.log(`Single SQL with JOINs & sub-aggregation: ${(performance.now() - startSql).toFixed(2)} ms`);

  await prisma.$disconnect();
}

test().catch(console.error);
