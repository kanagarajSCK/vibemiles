import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { getCustomerDetailsForAdmin } from '@/server/db/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['admin']);
    const { id } = await params;

    const customer = await getCustomerDetailsForAdmin(id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    console.error('Error fetching customer details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
