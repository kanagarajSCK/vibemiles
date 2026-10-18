import { NextRequest, NextResponse } from 'next/server';
import { getPublishedPackagesWithCount } from '@/server/db/packages';
import type { SortOption, PackageCategory } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const q = searchParams.get('q') || searchParams.get('search') || searchParams.get('query') || undefined;
    const destination = searchParams.get('destination') || undefined;
    const destinationId = searchParams.get('destinationId') || undefined;
    const destinationSlug = searchParams.get('destinationSlug') || undefined;
    const travelType = searchParams.get('travelType') || undefined;
    const vibe = searchParams.get('vibe') || undefined;
    const state = searchParams.get('state') || undefined;
    const city = searchParams.get('city') || undefined;
    const category = searchParams.get('category') || undefined;

    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');
    const minPrice = minPriceParam ? Number(minPriceParam) : undefined;
    const maxPrice = maxPriceParam ? Number(maxPriceParam) : undefined;

    const durationParam = searchParams.get('duration');
    const minDurationParam = searchParams.get('minDuration') || searchParams.get('minDays');
    const maxDurationParam = searchParams.get('maxDuration') || searchParams.get('maxDays');
    const duration = durationParam ? parseInt(durationParam, 10) : undefined;
    const minDuration = minDurationParam ? parseInt(minDurationParam, 10) : undefined;
    const maxDuration = maxDurationParam ? parseInt(maxDurationParam, 10) : undefined;

    const minRatingParam = searchParams.get('minRating');
    const minRating = minRatingParam ? parseFloat(minRatingParam) : undefined;

    const featuredParam = searchParams.get('featured') || searchParams.get('isFeatured');
    const isFeatured = featuredParam !== null && featuredParam !== undefined ? featuredParam === 'true' : undefined;

    const sort = (searchParams.get('sort') as SortOption) || undefined;

    // Pagination
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const skipParam = searchParams.get('skip');
    const takeParam = searchParams.get('take');

    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const limit = limitParam ? Math.max(1, Math.min(100, parseInt(limitParam, 10))) : 20;

    let skip: number | undefined = undefined;
    let take: number | undefined = undefined;

    if (skipParam !== null || takeParam !== null) {
      skip = skipParam ? parseInt(skipParam, 10) : undefined;
      take = takeParam ? parseInt(takeParam, 10) : undefined;
    } else if (pageParam !== null || limitParam !== null) {
      skip = (page - 1) * limit;
      take = limit;
    }

    const { packages, total } = await getPublishedPackagesWithCount({
      q,
      destination,
      destinationId,
      destinationSlug,
      travelType,
      vibe,
      state,
      city,
      category: category as PackageCategory | undefined,
      minPrice: isNaN(minPrice as number) ? undefined : minPrice,
      maxPrice: isNaN(maxPrice as number) ? undefined : maxPrice,
      duration: isNaN(duration as number) ? undefined : duration,
      minDuration: isNaN(minDuration as number) ? undefined : minDuration,
      maxDuration: isNaN(maxDuration as number) ? undefined : maxDuration,
      minRating: isNaN(minRating as number) ? undefined : minRating,
      isFeatured,
      sort,
      skip: isNaN(skip as number) ? undefined : skip,
      take: isNaN(take as number) ? undefined : take,
    });

    return NextResponse.json(
      {
        success: true,
        count: packages.length,
        total,
        page: skip !== undefined && take ? Math.floor(skip / take) + 1 : page,
        limit: take ?? limit,
        packages,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('API Error in /api/packages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}
