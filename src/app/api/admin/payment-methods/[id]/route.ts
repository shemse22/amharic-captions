import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db';
import { getSessionUser, isAdminUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PUT /api/admin/payment-methods/[id] - Admin: update a payment method
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!isAdminUser(user)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin privileges required' },
        { status: 403 }
      );
    }

    const resolvedParams = await context.params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid payment method ID' }, { status: 400 });
    }

    const body = await req.json();
    const updated = await dbService.updatePaymentMethod(id, body);

    if (!updated) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      method: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update payment method' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/payment-methods/[id] - Admin: delete a payment method
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!isAdminUser(user)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin privileges required' },
        { status: 403 }
      );
    }

    const resolvedParams = await context.params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid payment method ID' }, { status: 400 });
    }

    const success = await dbService.deletePaymentMethod(id);
    if (!success) {
      return NextResponse.json({ error: 'Payment method not found or could not be deleted' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to delete payment method' },
      { status: 500 }
    );
  }
}
