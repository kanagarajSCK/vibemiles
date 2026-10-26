import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { STATE_CODE_MAP } from '@/lib/india-locations';
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
}

function scoreDestination(
  dest: { name: string; state: string; country: string; tags?: string[] },
  query: string
): number {
  const q = query.toLowerCase();
  const name = dest.name.toLowerCase();
  const state = dest.state.toLowerCase();
  const country = dest.country.toLowerCase();

  if (name === q) return 1000;
  if (name.startsWith(q)) return 800;
  if (name.includes(q)) return 600;
  if (state.startsWith(q)) return 500;
  if (state.includes(q)) return 400;
  if (country.startsWith(q) || country.includes(q)) return 300;
  if (dest.tags && dest.tags.some((t) => t.toLowerCase().includes(q))) return 200;
  return 100;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || searchParams.get('search') || '').trim();
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '10', 10)), 25);

    if (!q || q.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const normalizedQ = q.toLowerCase();

    // Query real PostgreSQL destination records with active tours, excluding demo
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
        slug: true,
        name: true,
        state: true,
        country: true,
        heroImage: true,
        packageCount: true,
        rating: true,
        tags: true,
      },
      take: 50,
    });

    // Score and rank matches
    const scored = destinations.map((d) => {
      const score = scoreDestination(d, q);
      const stateCode = STATE_CODE_MAP[d.state] || '';
      const countryCode = d.country === 'India' ? 'IN' : '';

      const item: DestinationSearchResult = {
        id: d.id,
        name: d.name,
        slug: d.slug,
        state: d.state,
        stateCode,
        country: d.country,
        countryCode,
        type: 'DESTINATION',
        heroImage: d.heroImage,
        packageCount: d.packageCount,
        rating: d.rating,
        tags: d.tags,
        aliases: d.tags,
        searchable: true,
        normalizedName: d.name.toLowerCase(),
      };

      return { item, score, packageCount: d.packageCount };
    });

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.packageCount !== a.packageCount) return b.packageCount - a.packageCount;
      return a.item.name.localeCompare(b.item.name);
    });

    const results = scored.slice(0, limit).map((s) => s.item);

    return NextResponse.json(
      { results },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('Error searching destinations from database, falling back:', error);

    // Fallback to MOCK_DESTINATIONS if database is unreachable
    try {
      const { searchParams } = new URL(request.url);
      const q = (searchParams.get('q') || '').trim();
      const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '10', 10)), 25);

      if (!q) return NextResponse.json({ results: [] });

      const normalizedQ = q.toLowerCase();
      const matches = MOCK_DESTINATIONS.filter((d) => {
        const hasTours = (d.packageCount ?? 0) > 0;
        const isDemo = d.name.toLowerCase().includes('demo') || d.slug.toLowerCase().includes('demo');
        if (!hasTours || isDemo) return false;

        return (
          d.name.toLowerCase().includes(normalizedQ) ||
          d.state.toLowerCase().includes(normalizedQ) ||
          d.country.toLowerCase().includes(normalizedQ) ||
          d.slug.toLowerCase().includes(normalizedQ) ||
          d.tags.some((t) => t.toLowerCase().includes(normalizedQ))
        );
      });

      const scored = matches.map((d) => {
        const score = scoreDestination(d, q);
        return {
          item: {
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
            normalizedName: d.name.toLowerCase(),
          },
          score,
          packageCount: d.packageCount,
        };
      });

      scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.packageCount !== a.packageCount) return b.packageCount - a.packageCount;
        return a.item.name.localeCompare(b.item.name);
      });

      return NextResponse.json({ results: scored.slice(0, limit).map((s) => s.item) });
    } catch {
      return NextResponse.json({ results: [] });
    }
  }
}
