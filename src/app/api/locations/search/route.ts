import { NextRequest, NextResponse } from 'next/server';
import { searchIndiaLocations } from '@/lib/india-locations';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 25);

  if (!q || q.length === 0) {
    return NextResponse.json({ results: [] });
  }

  // Uses the robust, unified search engine mapping states, UTC, typo tolerances, etc.
  const matchedLocations = searchIndiaLocations(q, limit);

  return NextResponse.json({ results: matchedLocations });
}
