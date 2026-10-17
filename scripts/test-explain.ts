import { prisma } from '../src/lib/prisma';

async function testExplain() {
  console.log('--- EXPLAIN ANALYZE FOR PUBLIC PACKAGE QUERY ---');
  const plan = await prisma.$queryRawUnsafe<any[]>(`
    EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
    SELECT "public"."Package"."id", "public"."Package"."slug", "public"."Package"."name", "public"."Package"."finalPrice"
    FROM "public"."Package"
    WHERE "public"."Package"."status" = 'PUBLISHED'::"public"."ListingStatus"
      AND "public"."Package"."approvalStatus" = 'APPROVED'::"public"."ApprovalStatus"
      AND "public"."Package"."isActive" = true
    ORDER BY "public"."Package"."isFeatured" DESC, "public"."Package"."rating" DESC
    LIMIT 6 OFFSET 0;
  `);

  console.log(plan.map((r: any) => r['QUERY PLAN']).join('\n'));
  await prisma.$disconnect();
}

testExplain().catch(console.error);
