import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const txRef = searchParams.get('tx_ref');

    if (!txRef) {
      return NextResponse.json({ error: 'tx_ref is required' }, { status: 400 });
    }

    const chapaSecretKey = process.env.CHAPA_SECRET_KEY || process.env.CHAPA_KEY;
    let payment = await dbService.findPaymentByTxRef(txRef);

    if (chapaSecretKey && payment && payment.status !== 'approved') {
      try {
        const chapaRes = await fetch(`https://api.chapa.co/v1/transaction/verify/${txRef}`, {
          headers: { Authorization: `Bearer ${chapaSecretKey}` },
        });
        const chapaData = await chapaRes.json();
        if (chapaRes.ok && chapaData.status === 'success') {
          payment = await dbService.approvePaymentByTxRef(txRef);
        }
      } catch (err: unknown) {
        console.warn('Chapa verification request error:', err instanceof Error ? err.message : err);
      }
    }

    if (
      !chapaSecretKey &&
      process.env.NODE_ENV !== 'production' &&
      searchParams.get('simulate') === 'true' &&
      payment?.status === 'pending' &&
      payment.paymentMethod === 'CHAPA'
    ) {
      payment = await dbService.approvePaymentByTxRef(txRef);
    }

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      payment,
      approved: payment.status === 'approved',
    });
  } catch (error: unknown) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    );
  }
}
