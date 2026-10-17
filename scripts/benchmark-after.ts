/**
 * VibeMiles Post-Optimization Benchmark & Validation Script
 * Compares:
 * 1. Uncached vs Cached Destinations & Categories queries
 * 2. Full relational package queries vs Lean Card Queries
 * 3. Before vs After latencies across high-traffic read paths
 */

import { prisma } from '../src/lib/prisma';
import {
  getPublishedPackages,
  getPublishedPackagesWithCount,
  getPackageBySlug,
} from '../src/server/db/packages';
import { getDestinations } from '../src/server/db/destinations';
import { getCategories } from '../src/server/db/categories';

async function timeOperation<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await fn();
  const durationMs = Math.round((performance.now() - start) * 100) / 100;
  return { result, durationMs };
}

async function runPostOptimizationBenchmark() {
  console.log('================================================================');
  console.log(' VIBEMILES POST-OPTIMIZATION PERFORMANCE BENCHMARK');
  console.log('================================================================\n');

  // Warmup connection
  await prisma.$queryRaw`SELECT 1`;

  // 1. Supabase Ping
  const ping = await timeOperation(() => prisma.$queryRaw`SELECT 1`);
  console.log(`[Database Connection] Supabase AWS Ping: ${ping.durationMs} ms`);

  // 2. Package Card Queries (Lean Includes)
  const pkgsList = await timeOperation(() => getPublishedPackagesWithCount({ take: 12 }));
  console.log(`[Packages List] getPublishedPackagesWithCount (Lean Card includes): ${pkgsList.durationMs} ms (count: ${pkgsList.result.packages.length}, total: ${pkgsList.result.total})`);

  const featured = await timeOperation(() => getPublishedPackages({ isFeatured: true, take: 6 }));
  console.log(`[Featured Packages] getPublishedPackages(isFeatured: true): ${featured.durationMs} ms (count: ${featured.result.length})`);

  // 3. Destinations Cache Performance
  // Cold run (hits DB or populated in current process)
  const destCold = await timeOperation(() => getDestinations());
  console.log(`[Destinations - Run 1] getDestinations(): ${destCold.durationMs} ms (count: ${destCold.result.length})`);

  // Warm run (hits in-memory cache)
  const destWarm = await timeOperation(() => getDestinations());
  console.log(`[Destinations - Run 2 Cached] getDestinations(): ${destWarm.durationMs} ms (count: ${destWarm.result.length})`);
  console.log(`  -> Cache Speedup: ${destCold.durationMs > 0 ? (destCold.durationMs / Math.max(destWarm.durationMs, 0.01)).toFixed(0) : 'N/A'}x faster`);

  // 4. Categories Cache Performance
  // Cold run
  const catCold = await timeOperation(() => getCategories());
  console.log(`[Categories - Run 1] getCategories(): ${catCold.durationMs} ms (count: ${catCold.result.length})`);

  // Warm run
  const catWarm = await timeOperation(() => getCategories());
  console.log(`[Categories - Run 2 Cached] getCategories(): ${catWarm.durationMs} ms (count: ${catWarm.result.length})`);
  console.log(`  -> Cache Speedup: ${catCold.durationMs > 0 ? (catCold.durationMs / Math.max(catWarm.durationMs, 0.01)).toFixed(0) : 'N/A'}x faster`);

  console.log('\n================================================================');
  console.log(' BENCHMARK COMPLETED SUCCESSFULLY');
  console.log('================================================================');

  await prisma.$disconnect();
}

runPostOptimizationBenchmark().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
