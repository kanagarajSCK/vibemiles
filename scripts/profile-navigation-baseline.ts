/**
 * VibeMiles Navigation & Route Latency Profiling Script
 * Measures:
 * 1. HTTP Request Latency for key marketplace routes (Cold & Warm)
 * 2. Database query latency and query breakdown
 * 3. Payload sizes transferred
 */

import { prisma } from '../src/lib/prisma';
import { getPublishedPackages, getPackageBySlug } from '../src/server/db/packages';
import { getDestinations } from '../src/server/db/destinations';
import { getCategories } from '../src/server/db/categories';
import { dealService } from '../src/services/deal.service';

const BASE_URL = 'http://localhost:3000';

interface MetricResult {
  route: string;
  coldHttpMs: number;
  warmHttpMs: number;
  dbQueryMs: number;
  responseBytes: number;
  dbQueriesCount: number;
}

async function measureHttp(path: string): Promise<{ durationMs: number; bytes: number }> {
  const start = performance.now();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'RSC': '1', // Request React Server Component payload to measure App Router stream
    },
  });
  const text = await res.text();
  const durationMs = Math.round((performance.now() - start) * 100) / 100;
  return { durationMs, bytes: Buffer.byteLength(text, 'utf-8') };
}

async function measureDirectHtml(path: string): Promise<{ durationMs: number; bytes: number }> {
  const start = performance.now();
  const res = await fetch(`${BASE_URL}${path}`);
  const text = await res.text();
  const durationMs = Math.round((performance.now() - start) * 100) / 100;
  return { durationMs, bytes: Buffer.byteLength(text, 'utf-8') };
}

async function runProfiling() {
  console.log('================================================================');
  console.log(' VIBEMILES DEEP NAVIGATION & ROUTE LATENCY BASELINE PROFILING');
  console.log('================================================================\n');

  // Ensure DB warm
  await prisma.$queryRaw`SELECT 1`;

  // Get sample package slug
  const samplePkgs = await getPublishedPackages({ take: 1 });
  const sampleSlug = samplePkgs[0]?.slug || 'manali-himalayan-adventure';
  const samplePkgId = samplePkgs[0]?.id || 'sample-id';

  const routes = [
    { name: 'Home (/)', path: '/' },
    { name: 'Packages (/packages)', path: '/packages' },
    { name: `Package Detail (/packages/${sampleSlug})`, path: `/packages/${sampleSlug}` },
    { name: 'Destinations (/destinations)', path: '/destinations' },
    { name: 'Deals (/deals)', path: '/deals' },
    { name: 'Search (/search?q=kerala)', path: '/search?q=kerala' },
    { name: `Booking Form (/booking/${samplePkgId})`, path: `/booking/${samplePkgId}` },
    { name: 'Login (/login)', path: '/login' },
    { name: 'Account Dashboard (/account/dashboard)', path: '/account/dashboard' },
    { name: 'Provider Dashboard (/provider/dashboard)', path: '/provider/dashboard' },
    { name: 'Admin Dashboard (/admin/dashboard)', path: '/admin/dashboard' },
  ];

  console.log('--- 1. HTTP Full Document & RSC Navigation Times ---');
  console.log(
    'Route'.padEnd(45) +
    'Cold HTTP'.padEnd(14) +
    'Warm HTTP'.padEnd(14) +
    'RSC Payload'.padEnd(14) +
    'Size (KB)'
  );
  console.log('-'.repeat(95));

  for (const r of routes) {
    try {
      // Cold HTML
      const cold = await measureDirectHtml(r.path);
      // Warm HTML
      const warm = await measureDirectHtml(r.path);
      // RSC stream payload (what next/link downloads on route transition)
      const rsc = await measureHttp(r.path);

      console.log(
        r.name.padEnd(45) +
        `${cold.durationMs} ms`.padEnd(14) +
        `${warm.durationMs} ms`.padEnd(14) +
        `${rsc.durationMs} ms`.padEnd(14) +
        `${(rsc.bytes / 1024).toFixed(1)} KB`
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(r.name.padEnd(45) + `ERROR: ${msg}`);
    }
  }

  console.log('\n--- 2. Database Service Execution Breakdown ---');
  
  // Home queries
  const tHomeStart = performance.now();
  await Promise.all([
    getPublishedPackages({ isFeatured: true, take: 6 }),
    getDestinations(),
  ]);
  const homeDbTime = Math.round((performance.now() - tHomeStart) * 100) / 100;
  console.log(`[Home Data] Featured packages + Destinations: ${homeDbTime} ms`);

  // Packages list query
  const tPkgStart = performance.now();
  await getPublishedPackages({ take: 12 });
  const pkgDbTime = Math.round((performance.now() - tPkgStart) * 100) / 100;
  console.log(`[Packages Catalog] getPublishedPackages(take: 12): ${pkgDbTime} ms`);

  // Package detail queries
  const tDetailStart = performance.now();
  const pkgDetail = await getPackageBySlug(sampleSlug);
  const detailPkgTime = Math.round((performance.now() - tDetailStart) * 100) / 100;
  console.log(`[Package Detail] getPackageBySlug: ${detailPkgTime} ms`);

  // Destinations query
  const tDestStart = performance.now();
  await getDestinations();
  const destDbTime = Math.round((performance.now() - tDestStart) * 100) / 100;
  console.log(`[Destinations] getDestinations (cached): ${destDbTime} ms`);

  // Deals service
  const tDealStart = performance.now();
  await dealService.getDeals();
  const dealTime = Math.round((performance.now() - tDealStart) * 100) / 100;
  console.log(`[Deals] dealService.getDeals: ${dealTime} ms`);

  console.log('\n================================================================');
  console.log(' BASELINE MEASUREMENT COMPLETE');
  console.log('================================================================');
  await prisma.$disconnect();
}

runProfiling().catch(console.error);
