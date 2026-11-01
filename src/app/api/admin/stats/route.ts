import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';
import { getSessionUser, isAdminUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const [payments, videos, users] = await Promise.all([
      dbService.listPayments(),
      dbService.listVideos(),
      dbService.listUsers(),
    ]);

    // Financial Metrics
    const approvedPayments = payments.filter((p) => p.status === 'approved');
    const pendingPayments = payments.filter((p) => p.status === 'pending');
    const rejectedPayments = payments.filter((p) => p.status === 'rejected');

    const totalBalanceEtb = approvedPayments.reduce((sum, p) => sum + (Number(p.amountEtb) || 0), 0);
    const pendingAmountEtb = pendingPayments.reduce((sum, p) => sum + (Number(p.amountEtb) || 0), 0);

    // Video Metrics
    const pendingVideos = videos.filter((v) => v.status === 'PENDING_APPROVAL');
    const approvedVideos = videos.filter((v) => v.status === 'APPROVED');
    const rejectedVideos = videos.filter((v) => v.status === 'REJECTED');

    // Totals
    const totalRequests = payments.length + videos.length;
    const totalPendings = pendingPayments.length + pendingVideos.length;

    // Payment method breakdown
    let telebirrRevenue = 0;
    let cbeRevenue = 0;
    let otherRevenue = 0;

    for (const p of approvedPayments) {
      const ref = (p.transactionRef || '').toUpperCase();
      const amt = Number(p.amountEtb) || 0;
      if (ref.startsWith('TB-') || ref.startsWith('TELEBIRR')) {
        telebirrRevenue += amt;
      } else if (ref.startsWith('CBE-') || ref.startsWith('CBE')) {
        cbeRevenue += amt;
      } else {
        otherRevenue += amt;
      }
    }

    // Creator community totals
    const totalCreditsCirculating = users.reduce((sum, u) => sum + (u.credits || 0), 0);
    const totalMinutesCirculating = users.reduce((sum, u) => sum + (u.minutes_balance || 0), 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalBalanceEtb,
        pendingAmountEtb,
        totalRequests,
        totalPendings,
        pendingPaymentsCount: pendingPayments.length,
        pendingVideosCount: pendingVideos.length,
        approvedPaymentsCount: approvedPayments.length,
        rejectedPaymentsCount: rejectedPayments.length,
        totalVideos: videos.length,
        approvedVideosCount: approvedVideos.length,
        rejectedVideosCount: rejectedVideos.length,
        totalUsers: users.length,
        totalCreditsCirculating,
        totalMinutesCirculating,
        revenueBreakdown: {
          telebirr: telebirrRevenue,
          cbeBirr: cbeRevenue,
          other: otherRevenue,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch admin stats' }, { status: 500 });
  }
}

