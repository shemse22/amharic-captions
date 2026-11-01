import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbService } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-chapa-signature');
    const webhookSecret = process.env.CHAPA_WEBHOOK_SECRET || process.env.CHAPA_SECRET_KEY;

    if (webhookSecret && signature) {
      const hash = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (hash !== signature) {
        console.warn('Invalid Chapa webhook signature:', { received: signature, computed: hash });
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const txRef = payload.tx_ref || payload.data?.tx_ref;
    const status = (payload.status || payload.data?.status || '').toLowerCase();
    const event = (payload.event || '').toLowerCase();

    if (!txRef) {
      return NextResponse.json({ error: 'Missing transaction reference (tx_ref)' }, { status: 400 });
    }

    if (status === 'success' || event === 'charge.complete' || event === 'charge.success') {
      const approvedPayment = await dbService.approvePaymentByTxRef(txRef);
      if (approvedPayment) {
        console.log(`Chapa Webhook: successfully credited payment ${txRef} for user #${approvedPayment.userId}`);
        return NextResponse.json({
          success: true,
          message: 'Payment approved and minutes credited successfully',
          payment: approvedPayment,
        });
      }

      console.warn(`Chapa Webhook: tx_ref ${txRef} not found in database`);
      return NextResponse.json({
        success: false,
        warning: 'Transaction reference not found',
      }, { status: 404 });
    }

    return NextResponse.json({ received: true, status });
  } catch (error: any) {
    console.error('Chapa webhook handling error:', error);
    return NextResponse.json(
      { error: error?.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
