import { NextResponse } from 'next/server';
import { requireRole } from '@/server/auth/guard';
import { prisma } from '@/lib/prisma';
import { getProviderFinancialSummary } from '@/server/db/payments';

export async function GET() {
  try {
    const auth = await requireRole(['provider', 'admin']);

    let providerId: string | null = null;
    if (auth.user.role === 'provider') {
      const profile = await prisma.providerProfile.findUnique({
        where: { userId: auth.user.id },
      });
      if (!profile) {
        return NextResponse.json({ error: 'Provider profile not found.' }, { status: 404 });
      }
      providerId = profile.id;
    } else {
      // If admin viewing provider route, fetch first active provider or handle gracefully
      const profile = await prisma.providerProfile.findFirst();
      if (!profile) {
        return NextResponse.json({ error: 'No provider profiles exist.' }, { status: 404 });
      }
      providerId = profile.id;
    }

    const earnings = await getProviderFinancialSummary(providerId);

    return NextResponse.json({
      success: true,
      data: earnings,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to retrieve provider earnings.';
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
