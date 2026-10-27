import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  STATE_CODE_MAP,
  searchIndiaLocations,
  getNearbyDestinations,
  normalizeLocationText,
  type NearbyDestinationSuggestion,
} from '@/lib/india-locations';
import { MOCK_DESTINATIONS } from '@/lib/mock-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface DestinationSearchResult {
  id: string;
  name: string;
  slug: string;
  state: string;
  stateCode: string;
  country: string;
  countryCode: string;
  type: string;
  heroImage?: string;
  packageCount: number;
  rating: number;
  tags: string[];
  aliases: string[];
  searchable: boolean;
  normalizedName: string;
  nearbyDestinations?: NearbyDestinationSuggestion[];
}

function scoreMatch(
  name: string,
  state: string,
  country: string,
  aliases: string[],
  query: string
): number {
  const q = normalizeLocationText(query);
  const n = normalizeLocationText(name);
  const s = normalizeLocationText(state);
  const c = normalizeLocationText(country);

  if (n === q) return 20000;
  if (aliases.some((a) => normalizeLocationText(a) === q)) return 18000;
  if (n.startsWith(q)) return 15000;
  if (n.split(' ').some((word) => word.startsWith(q))) return 14000;
  if (aliases.some((a) => normalizeLocationText(a).startsWith(q))) return 13000;
  if (s === q) return 12000;
  if (s.startsWith(q)) return 10000;
  if (n.includes(q)) return 5000;
  if (s.includes(q)) return 3000;
  if (c.startsWith(q) || c.includes(q)) return 2000;
  return 1000;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || searchParams.get('search') || '').trim();
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '10', 10)), 25);

  if (!q || q.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const normalizedQ = normalizeLocationText(q);

  try {
    // 1. Query real destinations from DB (without restricting packageCount > 0, excluding demo)
    const [dbDestinations, cityCounts] = await Promise.all([
      prisma.destination.findMany({
        where: {
          NOT: [
            { name: { contains: 'demo', mode: 'insensitive' } },
            { slug: { contains: 'demo', mode: 'insensitive' } },
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
          slug: true,
          name: true,
          state: true,
          country: true,
          heroImage: true,
          packageCount: true,
          rating: true,
          tags: true,
        },
        take: 40,
      }).catch(() => []),
      prisma.package.groupBy({
        by: ['city'],
        where: {
          status: 'PUBLISHED',
          approvalStatus: 'APPROVED',
          isActive: true,
          city: { not: null },
        },
        _count: { id: true },
      }).catch(() => []),
    ]);

    const cityPackageCountMap = new Map<string, number>();
    for (const row of cityCounts) {
      if (row.city) {
        cityPackageCountMap.set(normalizeLocationText(row.city), row._count.id);
      }
    }

    // 2. Search comprehensive India locations (covers Salem, Erode, Tirunelveli, and all Indian cities/towns)
    const indiaLocations = searchIndiaLocations(q, 20);

    // Map to keep track of added locations by normalized name
    const resultMap = new Map<string, DestinationSearchResult>();
    const scoredList: Array<{ item: DestinationSearchResult; score: number }> = [];

    // Add DB destinations
    for (const d of dbDestinations) {
      const key = normalizeLocationText(d.name);
      const stateCode = STATE_CODE_MAP[d.state] || '';
      const countryCode = d.country === 'India' ? 'IN' : '';
      const packageCount = d.packageCount ?? 0;

      const item: DestinationSearchResult = {
        id: d.id,
        name: d.name,
        slug: d.slug,
        state: d.state,
        stateCode,
        country: d.country,
        countryCode,
        type: 'DESTINATION',
        heroImage: d.heroImage || undefined,
        packageCount,
        rating: d.rating ?? 4.8,
        tags: d.tags || [],
        aliases: d.tags || [],
        searchable: true,
        normalizedName: key,
        nearbyDestinations: packageCount === 0 ? getNearbyDestinations(d.name, d.state) : undefined,
      };

      let score = scoreMatch(d.name, d.state, d.country, d.tags || [], q);
      if (packageCount > 0) score += 200;

      resultMap.set(key, item);
      scoredList.push({ item, score });
    }

    // Merge in India locations
    for (const loc of indiaLocations) {
      const key = normalizeLocationText(loc.name);
      if (resultMap.has(key)) {
        continue;
      }

      const stateCode = loc.stateCode || STATE_CODE_MAP[loc.state] || '';
      const countryCode = loc.countryCode || (loc.country === 'India' ? 'IN' : '');
      const packageCount = cityPackageCountMap.get(key) || 0;
      const nearbyDestinations = packageCount === 0 ? getNearbyDestinations(loc.name, loc.state) : undefined;

      const item: DestinationSearchResult = {
        id: loc.id,
        name: loc.name,
        slug: loc.slug || normalizeLocationText(loc.name).replace(/\s+/g, '-'),
        state: loc.state,
        stateCode,
        country: loc.country,
        countryCode,
        type: loc.type,
        heroImage: loc.heroImage,
        packageCount,
        rating: 4.8,
        tags: [loc.state, loc.type],
        aliases: loc.aliases,
        searchable: true,
        normalizedName: key,
        nearbyDestinations,
      };

      let score = scoreMatch(loc.name, loc.state, loc.country, loc.aliases, q);
      if (packageCount > 0) score += 200;

      resultMap.set(key, item);
      scoredList.push({ item, score });
    }

    // Sort by match score first, then package count, then alphabetical
    scoredList.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.item.packageCount !== a.item.packageCount) return b.item.packageCount - a.item.packageCount;
      return a.item.name.localeCompare(b.item.name);
    });

    const results = scoredList.slice(0, limit).map((s) => s.item);

    return NextResponse.json(
      { results },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('Database search error, using in-memory fallback:', error);

    // Resilient fallback combining searchIndiaLocations and MOCK_DESTINATIONS
    const indiaLocations = searchIndiaLocations(q, limit * 2);
    const scoredList: Array<{ item: DestinationSearchResult; score: number }> = [];
    const seen = new Set<string>();

    for (const d of MOCK_DESTINATIONS) {
      const isDemo = d.name.toLowerCase().includes('demo') || d.slug.toLowerCase().includes('demo');
      if (isDemo) continue;

      const key = normalizeLocationText(d.name);
      if (
        d.name.toLowerCase().includes(normalizedQ) ||
        d.state.toLowerCase().includes(normalizedQ) ||
        d.slug.toLowerCase().includes(normalizedQ)
      ) {
        seen.add(key);
        const item: DestinationSearchResult = {
          id: d.id,
          name: d.name,
          slug: d.slug,
          state: d.state,
          stateCode: STATE_CODE_MAP[d.state] || '',
          country: d.country,
          countryCode: d.country === 'India' ? 'IN' : '',
          type: 'DESTINATION',
          heroImage: d.heroImage,
          packageCount: d.packageCount,
          rating: d.rating,
          tags: d.tags,
          aliases: d.tags,
          searchable: true,
          normalizedName: key,
          nearbyDestinations: d.packageCount === 0 ? getNearbyDestinations(d.name, d.state) : undefined,
        };
        const score = scoreMatch(d.name, d.state, d.country, d.tags, q);
        scoredList.push({ item, score: score + (d.packageCount > 0 ? 200 : 0) });
      }
    }

    for (const loc of indiaLocations) {
      const key = normalizeLocationText(loc.name);
      if (seen.has(key)) continue;
      seen.add(key);

      const item: DestinationSearchResult = {
        id: loc.id,
        name: loc.name,
        slug: loc.slug || normalizeLocationText(loc.name).replace(/\s+/g, '-'),
        state: loc.state,
        stateCode: loc.stateCode || STATE_CODE_MAP[loc.state] || '',
        country: loc.country,
        countryCode: loc.countryCode || 'IN',
        type: loc.type,
        heroImage: loc.heroImage,
        packageCount: 0,
        rating: 4.8,
        tags: [loc.state, loc.type],
        aliases: loc.aliases,
        searchable: true,
        normalizedName: key,
        nearbyDestinations: getNearbyDestinations(loc.name, loc.state),
      };

      const score = scoreMatch(loc.name, loc.state, loc.country, loc.aliases, q);
      scoredList.push({ item, score });
    }

    scoredList.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.item.packageCount !== a.item.packageCount) return b.item.packageCount - a.item.packageCount;
      return a.item.name.localeCompare(b.item.name);
    });

    return NextResponse.json({
      results: scoredList.slice(0, limit).map((s) => s.item),
    });
  }
}
