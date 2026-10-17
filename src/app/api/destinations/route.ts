import { NextRequest, NextResponse } from 'next/server';
import { getDestinations } from '@/server/db/destinations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isPopularParam = searchParams.get('popular');
    const isTrendingParam = searchParams.get('trending');

    const isPopular = isPopularParam !== null ? isPopularParam === 'true' : undefined;
    const isTrending = isTrendingParam !== null ? isTrendingParam === 'true' : undefined;

    const destinations = await getDestinations({ isPopular, isTrending });

    return NextResponse.json({
      success: true,
      count: destinations.length,
      destinations,
    });
  } catch (error) {
    console.error('API Error in /api/destinations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch destinations' },
      { status: 500 }
    );
  }
}
