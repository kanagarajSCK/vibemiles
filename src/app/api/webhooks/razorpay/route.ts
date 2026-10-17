import { NextRequest, NextResponse } from 'next/server';
import { processRazorpayWebhookEvent } from '@/server/db/payments';

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 });
    }

    const rawBody = await req.text();

    const result = await processRazorpayWebhookEvent({
      rawBody,
      signatureHeader: signature,
    });

    return NextResponse.json({ received: true, ...result }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Webhook processing error';
    console.error('[webhooks/razorpay] Webhook error:', msg);

    if (msg.includes('cryptographic signature')) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
