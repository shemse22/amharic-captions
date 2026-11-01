import { dbService, type PaymentRecord } from '@/lib/db';

export type PaymentReviewAction = 'approved' | 'rejected';

export async function reviewPayment(
  paymentId: number,
  status: PaymentReviewAction,
  rejectionReason = 'Transaction could not be verified with banking records'
): Promise<PaymentRecord | null> {
  const payment = await dbService.updatePaymentStatus(paymentId, status);
  if (!payment) return null;

  try {
    if (status === 'approved') {
      await dbService.createNotification({
        userId: payment.userId,
        targetRole: 'USER',
        type: 'PAYMENT_APPROVED',
        title: 'ክፍያዎ ጸድቋል! (Payment Approved 🎉)',
        message: `የ ${payment.amountEtb} ብር ክፍያዎ በተሳካ ሁኔታ ጸድቆ ${payment.minutesCredited} ደቂቃ (${(payment.creditsCredited || 0).toLocaleString()} ክሬዲት) ወደ አካውንትዎ ገብቷል።`,
        data: {
          paymentId: payment.id,
          amountEtb: payment.amountEtb,
          planName: payment.planName,
          minutesCredited: payment.minutesCredited,
          creditsCredited: payment.creditsCredited,
          transactionRef: payment.transactionRef,
        },
      });
    } else {
      await dbService.createNotification({
        userId: payment.userId,
        targetRole: 'USER',
        type: 'PAYMENT_REJECTED',
        title: 'የክፍያ ጥያቄ ውድቅ ተደርጓል (Payment Not Approved)',
        message: `የ ${payment.amountEtb} ብር ክፍያዎ ማረጋገጫ አልተሳካም። ምክንያት: ${rejectionReason}`,
        data: {
          paymentId: payment.id,
          amountEtb: payment.amountEtb,
          reason: rejectionReason,
          transactionRef: payment.transactionRef,
        },
      });
    }
  } catch (notificationError) {
    console.warn('Failed to dispatch payment review notification:', notificationError);
  }

  return payment;
}
