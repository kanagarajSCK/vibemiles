import { NextRequest, NextResponse } from 'next/server';
import { getCategoryBySlug } from '@/server/db/categories';

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

    const category = await getCategoryBySlug(slug);

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error('API Error in /api/categories/[slug]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category details' },
      { status: 500 }
    );
  }
}
