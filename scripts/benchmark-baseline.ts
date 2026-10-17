/**
 * VibeMiles Performance Profiling & Baseline Benchmark Script
 * Measures:
 * 1. Database query latency and round-trip times (Supabase PostgreSQL)
 * 2. Full vs partial relational query overhead (itinerary, inclusions, availability)
 * 3. Package listing & count performance
 * 4. Destination & Category query performance
 * 5. Single package lookup performance
 * 6. Memory and event loop performance
 */

import { prisma } from '../src/lib/prisma';
import {
  getPublishedPackages,
  getPublishedPackagesWithCount,
  getPackageBySlug,
} from '../src/server/db/packages';
import { getDestinations } from '../src/server/db/destinations';
import { getCategories } from '../src/server/db/categories';

async function timeOperation<T>(name: string, fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await fn();
  const durationMs = Math.round((performance.now() - start) * 100) / 100;
  return { result, durationMs };
}

async function runBenchmark() {
  console.log('================================================================');
  console.log(' VIBEMILES PERFORMANCE PROFILING & MEASUREMENT (BASELINE)');
  console.log(' Environment: Node.js, Next.js 16.3.4, Prisma 6, Supabase PG');
  console.log('================================================================\n');

  // Warm up connection
  await prisma.$queryRaw`SELECT 1`;

  // 1. Direct Prisma Database Queries
  console.log('--- 1. Direct Prisma Query Latencies ---');
  
  const ping = await timeOperation('DB Ping (SELECT 1)', async () => {
    return prisma.$queryRaw`SELECT 1`;
  });
  console.log(`- Supabase Ping Latency: ${ping.durationMs} ms`);

  // Full includes package query (current implementation)
  const fullPkgQuery = await timeOperation('findMany with FULL includes (8 relations)', async () => {
    return prisma.package.findMany({
      where: { status: 'PUBLISHED', approvalStatus: 'APPROVED', isActive: true },
      take: 6,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        itinerary: { orderBy: { day: 'asc' } },
        inclusions: true,
        availability: { where: { isAvailable: true }, orderBy: { date: 'asc' } },
        destination: { select: { id: true, name: true, state: true, slug: true } },
        category: { select: { id: true, slug: true, name: true } },
        provider: { select: { id: true, businessName: true } },
      },
    });
  });
  console.log(`- Packages findMany (Full 8 Relations, take 6): ${fullPkgQuery.durationMs} ms (Found: ${fullPkgQuery.result.length})`);

  // Lean includes (card-only view: images, destination, category, provider; NO itinerary, NO inclusions)
  const leanPkgQuery = await timeOperation('findMany with LEAN includes (card view)', async () => {
    return prisma.package.findMany({
      where: { status: 'PUBLISHED', approvalStatus: 'APPROVED', isActive: true },
      take: 6,
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 2 },
        destination: { select: { id: true, name: true, state: true, slug: true } },
        category: { select: { id: true, slug: true, name: true } },
        provider: { select: { id: true, businessName: true } },
      },
    });
  });
  console.log(`- Packages findMany (Lean Card Relations, take 6): ${leanPkgQuery.durationMs} ms (Found: ${leanPkgQuery.result.length})`);
  console.log(`  -> Latency reduction potential: ${(fullPkgQuery.durationMs - leanPkgQuery.durationMs).toFixed(1)} ms (${(((fullPkgQuery.durationMs - leanPkgQuery.durationMs) / fullPkgQuery.durationMs) * 100).toFixed(1)}% faster)`);

  // Count query
  const countQuery = await timeOperation('count published packages', async () => {
    return prisma.package.count({
      where: { status: 'PUBLISHED', approvalStatus: 'APPROVED', isActive: true },
    });
  });
  console.log(`- Package count: ${countQuery.durationMs} ms (Count: ${countQuery.result})`);

  // Destinations query
  const destQuery = await timeOperation('findMany destinations', async () => {
    return prisma.destination.findMany({ orderBy: { name: 'asc' } });
  });
  console.log(`- Destinations findMany: ${destQuery.durationMs} ms (Found: ${destQuery.result.length})`);

  // Categories query
  const catQuery = await timeOperation('findMany categories', async () => {
    return prisma.category.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  });
  console.log(`- Categories findMany: ${catQuery.durationMs} ms (Found: ${catQuery.result.length})`);

  // Single package by slug (full details for PDP)
  const firstPkg = fullPkgQuery.result[0];
  if (firstPkg) {
    const singlePkg = await timeOperation(`Single package by slug ("${firstPkg.slug}")`, async () => {
      return getPackageBySlug(firstPkg.slug);
    });
    console.log(`- Single Package lookup: ${singlePkg.durationMs} ms`);
  }

  // 2. High-Level DB Service Functions
  console.log('\n--- 2. Database Access Layer Performance ---');
  
  const getPkgsWithCount = await timeOperation('getPublishedPackagesWithCount (take 12)', async () => {
    return getPublishedPackagesWithCount({ take: 12 });
  });
  console.log(`- getPublishedPackagesWithCount: ${getPkgsWithCount.durationMs} ms (Returned: ${getPkgsWithCount.result.packages.length}, Total: ${getPkgsWithCount.result.total})`);

  const getFeatured = await timeOperation('getPublishedPackages (featured, take 6)', async () => {
    return getPublishedPackages({ isFeatured: true, take: 6 });
  });
  console.log(`- getFeaturedPackages(6): ${getFeatured.durationMs} ms (Returned: ${getFeatured.result.length})`);

  const destsService = await timeOperation('getDestinations()', async () => {
    return getDestinations();
  });
  console.log(`- getDestinations(): ${destsService.durationMs} ms (Returned: ${destsService.result.length})`);

  const catsService = await timeOperation('getCategories()', async () => {
    return getCategories();
  });
  console.log(`- getCategories(): ${catsService.durationMs} ms (Returned: ${catsService.result.length})`);

  console.log('\n================================================================');
  console.log(' BASELINE PROFILING COMPLETED');
  console.log('================================================================');
}

runBenchmark()
  .catch((err) => {
    console.error('Benchmark failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
