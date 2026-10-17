import http from 'http';
import { prisma } from '../src/lib/prisma';
import { packageService } from '../src/services/package.service';
import { dealService } from '../src/services/deal.service';

interface RouteMeasurement {
  route: string;
  type: 'Static (SSG)' | 'ISR (60s)' | 'Dynamic (SSR)';
  coldTTFBMs: number;
  coldTotalMs: number;
  coldCacheHeader: string;
  warmTTFBMs: number;
  warmTotalMs: number;
  warmCacheHeader: string;
  responseBytes: number;
}

function requestRoute(path: string): Promise<{ ttfbMs: number; totalMs: number; cacheHeader: string; bytes: number; status: number }> {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    let firstByteTime = 0;
    let bytes = 0;

    const req = http.get(`http://localhost:3000${path}`, (res) => {
      const cacheHeader = (res.headers['x-nextjs-cache'] as string) || (res.headers['cache-control'] ? 'DYNAMIC/SSR' : 'NONE');

      res.on('data', (chunk) => {
        if (!firstByteTime) {
          firstByteTime = performance.now();
        }
        bytes += chunk.length;
      });

      res.on('end', () => {
        const end = performance.now();
        const ttfbMs = Math.round((firstByteTime ? firstByteTime - start : end - start) * 100) / 100;
        const totalMs = Math.round((end - start) * 100) / 100;
        resolve({
          ttfbMs,
          totalMs,
          cacheHeader,
          bytes,
          status: res.statusCode || 200,
        });
      });
    });

    req.on('error', reject);
  });
}

async function runBenchmark() {
  console.log('========================================================================');
  console.log(' VIBEMILES PRODUCTION PERFORMANCE BENCHMARK (NEXT.JS 16.3.4 PRODUCTION)');
  console.log('========================================================================\n');

  // Warm DB connection
  await prisma.$queryRaw`SELECT 1`;

  const samplePkgs = await packageService.getPackages({ take: 1 });
  const sampleSlug = samplePkgs[0]?.slug || 'manali-himalayan-adventure';
  const samplePkgId = samplePkgs[0]?.id || 'sample-id';

  const routes: Array<{ path: string; label: string; type: RouteMeasurement['type'] }> = [
    { path: '/', label: 'Home (/)', type: 'ISR (60s)' },
    { path: '/packages', label: 'Packages (/packages)', type: 'Dynamic (SSR)' },
    { path: `/packages/${sampleSlug}`, label: `Package Detail (/packages/${sampleSlug})`, type: 'Dynamic (SSR)' },
    { path: '/destinations', label: 'Destinations (/destinations)', type: 'ISR (60s)' },
    { path: '/deals', label: 'Deals (/deals)', type: 'Dynamic (SSR)' },
    { path: '/search?q=kerala', label: 'Search (/search?q=kerala)', type: 'Dynamic (SSR)' },
    { path: `/booking/${samplePkgId}`, label: `Booking Form (/booking/${samplePkgId})`, type: 'Dynamic (SSR)' },
    { path: '/login', label: 'Login (/login)', type: 'Static (SSG)' },
    { path: '/account/dashboard', label: 'Account Dashboard (/account/dashboard)', type: 'Static (SSG)' },
    { path: '/provider/dashboard', label: 'Provider Dashboard (/provider/dashboard)', type: 'Static (SSG)' },
    { path: '/admin/dashboard', label: 'Admin Dashboard (/admin/dashboard)', type: 'Static (SSG)' },
  ];

  const results: RouteMeasurement[] = [];

  for (const r of routes) {
    // Cold run
    const cold = await requestRoute(r.path);
    // Give event loop a breather
    await new Promise((resolve) => setTimeout(resolve, 50));
    // Warm run
    const warm = await requestRoute(r.path);

    results.push({
      route: r.label,
      type: r.type,
      coldTTFBMs: cold.ttfbMs,
      coldTotalMs: cold.totalMs,
      coldCacheHeader: cold.cacheHeader,
      warmTTFBMs: warm.ttfbMs,
      warmTotalMs: warm.totalMs,
      warmCacheHeader: warm.cacheHeader,
      responseBytes: warm.bytes,
    });
  }

  console.log('--- 1. HTTP PRODUCTION MEASUREMENTS (COLD VS WARM) ---');
  console.log(
    'Route'.padEnd(42) +
    'Type'.padEnd(16) +
    'Cold TTFB'.padEnd(12) +
    'Cold Total'.padEnd(13) +
    'Warm TTFB'.padEnd(12) +
    'Warm Total'.padEnd(13) +
    'Size (KB)'.padEnd(10) +
    'Cache'
  );
  console.log('-'.repeat(125));

  for (const res of results) {
    const sizeKb = (res.responseBytes / 1024).toFixed(1);
    console.log(
      res.route.padEnd(42) +
      res.type.padEnd(16) +
      `${res.coldTTFBMs} ms`.padEnd(12) +
      `${res.coldTotalMs} ms`.padEnd(13) +
      `${res.warmTTFBMs} ms`.padEnd(12) +
      `${res.warmTotalMs} ms`.padEnd(13) +
      `${sizeKb} KB`.padEnd(10) +
      res.warmCacheHeader
    );
  }

  console.log('\n--- 2. IN-MEMORY DATABASE & DATA LAYER LATENCY ---');
  // Featured packages
  const tFeatCold = performance.now();
  await packageService.getFeaturedPackages(6);
  const dFeatCold = performance.now() - tFeatCold;

  const tFeatWarm = performance.now();
  await packageService.getFeaturedPackages(6);
  const dFeatWarm = performance.now() - tFeatWarm;
  console.log(`getFeaturedPackages(6): Cold = ${dFeatCold.toFixed(2)} ms | Warm (Cached) = ${dFeatWarm.toFixed(2)} ms`);

  // Published packages
  const tPubCold = performance.now();
  await packageService.getPackages({ take: 24 });
  const dPubCold = performance.now() - tPubCold;

  const tPubWarm = performance.now();
  await packageService.getPackages({ take: 24 });
  const dPubWarm = performance.now() - tPubWarm;
  console.log(`getPackages(take: 24): Cold = ${dPubCold.toFixed(2)} ms | Warm (Cached) = ${dPubWarm.toFixed(2)} ms`);

  // Package by slug
  const tSlugCold = performance.now();
  await packageService.getPackageBySlug(sampleSlug);
  const dSlugCold = performance.now() - tSlugCold;

  const tSlugWarm = performance.now();
  await packageService.getPackageBySlug(sampleSlug);
  const dSlugWarm = performance.now() - tSlugWarm;
  console.log(`getPackageBySlug(${sampleSlug}): Cold = ${dSlugCold.toFixed(2)} ms | Warm (Cached) = ${dSlugWarm.toFixed(2)} ms`);

  // Destinations
  const tDestCold = performance.now();
  await packageService.getDestinations();
  const dDestCold = performance.now() - tDestCold;

  const tDestWarm = performance.now();
  await packageService.getDestinations();
  const dDestWarm = performance.now() - tDestWarm;
  console.log(`getDestinations(): Cold = ${dDestCold.toFixed(2)} ms | Warm (Cached) = ${dDestWarm.toFixed(2)} ms`);

  // Deals
  const tDeals = performance.now();
  await dealService.getDeals();
  const dDeals = performance.now() - tDeals;
  console.log(`dealService.getDeals(): ${dDeals.toFixed(2)} ms`);

  console.log('\n========================================================================');
  console.log(' BENCHMARK COMPLETED SUCCESSFULLY');
  console.log('========================================================================');

  await prisma.$disconnect();
}

runBenchmark().catch(console.error);
