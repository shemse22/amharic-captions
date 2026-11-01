import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, isAdminUser } from '@/lib/auth';
import { reviewPayment } from '@/lib/payment-review';

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();

    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    const { id } = await context.params;
    if (!/^[1-9]\d*$/.test(id)) {
      return NextResponse.json({ error: 'Invalid payment ID.' }, { status: 400 });
    }
    const paymentId = Number(id);
    if (!Number.isSafeInteger(paymentId)) {
      return NextResponse.json({ error: 'Invalid payment ID.' }, { status: 400 });
    }

    const updated = await reviewPayment(paymentId, 'approved');
    if (!updated) {
      return NextResponse.json(
        { error: 'Payment request was not found or is no longer pending' },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, payment: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Payment approval failed' }, { status: 500 });
  }
}
