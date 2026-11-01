import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, isAdminUser } from '@/lib/auth';
import { reviewPayment } from '@/lib/payment-review';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const { id } = await context.params;
    if (!/^[1-9]\d*$/.test(id)) {
      return NextResponse.json({ error: 'Invalid payment ID.' }, { status: 400 });
    }
    const paymentId = Number(id);
    if (!Number.isSafeInteger(paymentId)) {
      return NextResponse.json({ error: 'Invalid payment ID.' }, { status: 400 });
    }
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Transaction could not be verified with banking records';

    const updated = await reviewPayment(paymentId, 'rejected', reason);
    if (!updated) {
      return NextResponse.json(
        { error: 'Payment request was not found or is no longer pending' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Payment #${paymentId} marked as rejected. Reason: ${reason}`,
      payment: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Payment rejection failed' }, { status: 500 });
  }
}
