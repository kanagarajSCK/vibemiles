import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/server/auth/guard';
import { generateBookingTicketPdf } from '@/server/tickets/pdf-ticket';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const resolvedParams = await params;
    const bookingId = resolvedParams.id;

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }

    const ticket = await generateBookingTicketPdf(bookingId, auth.user);

    return new NextResponse(new Uint8Array(ticket.buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${ticket.filename}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to generate ticket PDF.';
    const status = message.toLowerCase().includes('not found')
      ? 404
      : message.toLowerCase().includes('access denied') || message.toLowerCase().includes('unauthorized')
      ? 403
      : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
