import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { updateCategoryInDb, archiveOrDeleteCategoryInDb } from '@/server/db/admin';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['admin']);
    const { id } = await params;
    const body = await req.json().catch(() => null);

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    const updated = await updateCategoryInDb({
      adminUser: { id: auth.user.id, email: auth.user.email },
      id,
      name: body?.name,
      icon: body?.icon,
      description: body?.description,
      isActive: body?.isActive,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully.',
      category: updated,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to update category.';
    const statusCode = message.includes('not found') ? 404 : 400;
    console.error('Error updating category:', error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['admin']);
    const { id } = await params;

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    const result = await archiveOrDeleteCategoryInDb({
      adminUser: { id: auth.user.id, email: auth.user.email },
      id,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to archive or delete category.';
    const statusCode = message.includes('not found') ? 404 : 400;
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
