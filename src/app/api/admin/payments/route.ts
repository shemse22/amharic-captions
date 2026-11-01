import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db';
import { getSessionUser, isAdminUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status'); // 'all', 'pending', 'approved', 'rejected'
    const query = searchParams.get('q')?.toLowerCase()?.trim();

    let payments = await dbService.listPayments();

    if (statusFilter && statusFilter !== 'all') {
      payments = payments.filter((p) => p.status === statusFilter);
    }

    if (query) {
      payments = payments.filter(
        (p) =>
          p.transactionRef?.toLowerCase()?.includes(query) ||
          p.userEmail?.toLowerCase()?.includes(query) ||
          p.userName?.toLowerCase()?.includes(query) ||
          p.planName?.toLowerCase()?.includes(query)
      );
    }

    return NextResponse.json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to list payments' }, { status: 500 });
  }
}

