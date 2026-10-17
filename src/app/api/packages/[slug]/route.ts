import { NextRequest, NextResponse } from 'next/server';
import { getPackageBySlug } from '@/server/db/packages';
import { getSessionUser } from '@/server/auth/guard';

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

    const auth = await getSessionUser().catch(() => null);

    const pkg = await getPackageBySlug(slug, {
      allowPreviewForUser: auth?.user ? { id: auth.user.id, role: auth.user.role } : undefined,
      requirePublished: !auth?.user || auth.user.role === 'customer',
    });

    if (!pkg) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        package: pkg,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('API Error in /api/packages/[slug]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch package details' },
      { status: 500 }
    );
  }
}
