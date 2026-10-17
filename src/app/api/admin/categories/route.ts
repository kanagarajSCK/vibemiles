import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { getAdminCategories, createCategoryInDb } from '@/server/db/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireRole(['admin']);
    const categories = await getAdminCategories();

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    console.error('Error fetching admin categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(['admin']);
    const body = await req.json().catch(() => null);

    const name = body?.name;
    const slug = body?.slug;
    const icon = body?.icon;
    const description = body?.description;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    const category = await createCategoryInDb({
      adminUser: { id: auth.user.id, email: auth.user.email },
      name,
      slug,
      icon,
      description,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'Category created successfully.',
      category,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to create category.';
    const statusCode = message.includes('already exists') ? 409 : 400;
    console.error('Error creating category:', error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
