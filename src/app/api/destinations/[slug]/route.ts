import { NextRequest, NextResponse } from 'next/server';
import { getDestinationBySlug } from '@/server/db/destinations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    const destination = await getDestinationBySlug(slug);

    if (!destination) {
      return NextResponse.json(
        { success: false, error: 'Destination not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      destination,
    });
  } catch (error) {
    console.error('API Error in /api/destinations/[slug]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch destination details' },
      { status: 500 }
    );
  }
}
