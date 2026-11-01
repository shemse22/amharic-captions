import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { dbService } from '@/lib/db';
import { getSessionUser, isAdminUser } from '@/lib/auth';
import { isSupportedReceiptImage, MAX_RECEIPT_SIZE_BYTES } from '@/lib/payment-receipt';
import { getPlanById } from '@/lib/pricing-plans';
import { sendPendingPaymentToTelegram } from '@/lib/telegram';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const payments = await dbService.listPayments();
  const visiblePayments = isAdminUser(user)
    ? payments
    : payments.filter(
        (payment) =>
          payment.userId === user.id ||
          payment.userEmail?.toLowerCase() === user.email.toLowerCase()
      );
  return NextResponse.json({ payments: visiblePayments });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required to buy a package.' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid payment request body.' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid payment request body.' }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const planName = typeof payload.planName === 'string' ? payload.planName.trim() : '';
    const plan = getPlanById(planName);
    if (!plan) {
      return NextResponse.json({ error: 'Please select a valid package.' }, { status: 400 });
    }

    const screenshotPath =
      typeof payload.screenshotPath === 'string' ? payload.screenshotPath.trim() : '';
    const submittedRef =
      typeof payload.transactionRef === 'string' ? payload.transactionRef.trim() : '';

    if (screenshotPath.length > 2048 || submittedRef.length > 200) {
      return NextResponse.json({ error: 'Receipt details are too long.' }, { status: 400 });
    }

    if (screenshotPath && !/^\/uploads\/[A-Za-z0-9_-]+\.(?:jpe?g|png|webp)$/i.test(screenshotPath)) {
      return NextResponse.json({ error: 'Please upload a valid receipt image.' }, { status: 400 });
    }

    if (screenshotPath) {
      const receiptPath = path.join(
        process.cwd(),
        'public',
        'uploads',
        screenshotPath.slice('/uploads/'.length)
      );
      let receiptBytes: Buffer;
      try {
        const stats = await fs.promises.stat(receiptPath);
        if (!stats.isFile() || stats.size > MAX_RECEIPT_SIZE_BYTES) {
          return NextResponse.json({ error: 'Please upload a valid receipt image.' }, { status: 400 });
        }
        receiptBytes = await fs.promises.readFile(receiptPath);
      } catch (err: unknown) {
        if (typeof err === 'object' && err !== null && 'code' in err && err.code === 'ENOENT') {
          return NextResponse.json({ error: 'Receipt image was not found. Please upload it again.' }, { status: 400 });
        }
        throw err;
      }

      const extension = path.extname(receiptPath).toLowerCase();
      const receiptTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
      };
      const receiptType = receiptTypes[extension];
      if (!receiptType || !isSupportedReceiptImage({ type: receiptType, size: receiptBytes.length }, receiptBytes)) {
        return NextResponse.json({ error: 'The uploaded receipt is not a valid image.' }, { status: 400 });
      }
    }

    if (!screenshotPath && !submittedRef) {
      return NextResponse.json(
        { error: 'እባክዎ የክፍያ ደረሰኝ ፎቶ (Receipt Screenshot) ያያይዙ' },
        { status: 400 }
      );
    }

    const cleanRef = submittedRef
      ? submittedRef
      : `TB-REC-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Check if reference was already submitted
    const existing = await dbService.findPaymentByTxRef(cleanRef);
    if (existing) {
      return NextResponse.json(
        { error: 'ይህ ደረሰኝ ቀድሞ ገብቷል (This transaction has already been submitted).' },
        { status: 400 }
      );
    }

    const payment = await dbService.createPayment({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      planName: plan.id,
      amountEtb: plan.priceEtb,
      transactionRef: cleanRef,
      paymentMethod: 'TELEBIRR_MANUAL',
      screenshotPath: screenshotPath || undefined,
      minutesCredited: plan.minutes,
      creditsCredited: plan.credits,
      status: 'pending',
    });

    // Notify Administrator of new pending payment slip
    try {
      await dbService.createNotification({
        targetRole: 'ADMIN',
        type: 'PAYMENT_PENDING',
        title: 'አዲስ የክፍያ ደረሰኝ ገብቷል (New Payment Receipt) 💰',
        message: `${user.name || user.email || 'ተጠቃሚ'} የ ${plan.priceEtb} ETB ደረሰኝ ለ ${plan.id} (${plan.minutes} ደቂቃ) አስገብቷል። Ref: ${cleanRef}`,
        data: {
          paymentId: payment.id,
          amountEtb: plan.priceEtb,
          planName: plan.id,
          minutesCredited: plan.minutes,
          creditsCredited: plan.credits,
          transactionRef: cleanRef,
          userName: user.name,
          userEmail: user.email,
        },
      });
    } catch (notifErr) {
      console.warn('Failed to dispatch admin notification:', notifErr);
    }

    try {
      await sendPendingPaymentToTelegram(payment);
    } catch (telegramError) {
      console.error('Failed to send pending payment to Telegram:', telegramError);
    }

    return NextResponse.json({
      success: true,
      message: 'የክፍያ ጥያቄዎ በተሳካ ሁኔታ ተልኳል! በቅርቡ ተረጋግጦ ደቂቃዎ ይጨመራል። (Payment recorded for verification)',
      payment,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Payment submission failed' },
      { status: 500 }
    );
  }
}
