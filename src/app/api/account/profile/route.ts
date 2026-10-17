import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, verifyOwnership } from '@/server/auth/guard';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const sessionData = await getSessionUser();
    if (!sessionData) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    if (sessionData.user.role !== 'customer') {
      return NextResponse.json({ error: 'Access denied: Customer role required.' }, { status: 403 });
    }

    // Optional query parameter: targetUserId (tests IDOR protection)
    const targetUserId = request.nextUrl.searchParams.get('userId');
    if (targetUserId) {
      const isAllowed = verifyOwnership(targetUserId, sessionData.user.id, sessionData.user.role);
      if (!isAllowed) {
        return NextResponse.json(
          { error: 'Forbidden: You cannot access another user’s profile.' },
          { status: 403 }
        );
      }
    }

    const customer = await prisma.customerProfile.findUnique({
      where: { userId: sessionData.user.id },
    });

    return NextResponse.json({
      user: sessionData.user,
      profile: customer,
    });
  } catch (error) {
    console.error('Account profile error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
