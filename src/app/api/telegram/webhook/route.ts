import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db';
import { reviewPayment } from '@/lib/payment-review';
import {
  answerTelegramCallback,
  escapeTelegramHtml,
  getTelegramConfig,
  sendTelegramMessage,
  TelegramUpdate,
  updateTelegramPaymentMessage,
} from '@/lib/telegram';

export const dynamic = 'force-dynamic';

async function sendAdminStats(adminChatId: string): Promise<void> {
  const [payments, videos, users] = await Promise.all([
    dbService.listPayments(),
    dbService.listVideos(),
    dbService.listUsers(),
  ]);

  const approvedPayments = payments.filter((payment) => payment.status === 'approved');
  const totalRevenue = approvedPayments.reduce(
    (sum, payment) => sum + (Number(payment.amountEtb) || 0),
    0
  );
  const totalInQueue =
    payments.filter((payment) => payment.status === 'pending').length +
    videos.filter((video) => video.status === 'PENDING_APPROVAL').length;
  const formatEtb = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalRevenue);

  await sendTelegramMessage(
    adminChatId,
    [
      'Bgern Admin Stats',
      '',
      `Total Revenue Collected: ETB ${formatEtb}`,
      `Payment Transactions: ${payments.length}`,
      `Total In Queue: ${totalInQueue}`,
      `Registered Creators: ${users.length}`,
    ].join('\n')
  );
}

function isValidSecret(received: string | null, expected: string | undefined): boolean {
  if (!received || !expected) return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function POST(request: NextRequest) {
  const { adminChatId, webhookSecret } = getTelegramConfig();
  if (!adminChatId || !isValidSecret(
    request.headers.get('x-telegram-bot-api-secret-token'),
    webhookSecret
  )) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 64 * 1024) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let update: TelegramUpdate;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const incomingMessage = update.message;
  if (
    incomingMessage?.chat.type === 'private' &&
    String(incomingMessage.chat.id) === adminChatId &&
    String(incomingMessage.from?.id) === adminChatId &&
    /^\/stats(?:@\w+)?(?:\s|$)/.test(incomingMessage.text?.trim() || '')
  ) {
    try {
      await sendAdminStats(adminChatId);
      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error('Telegram admin stats request failed:', error);
      return NextResponse.json({ error: 'Could not load admin stats' }, { status: 500 });
    }
  }

  const callback = update.callback_query;
  if (!callback) return NextResponse.json({ ok: true });

  const message = callback.message;
  if (
    !message ||
    String(message.chat.id) !== adminChatId ||
    String(callback.from.id) !== adminChatId
  ) {
    return NextResponse.json({ ok: true });
  }

  const match = callback.data?.match(/^payment:(approve|reject):([1-9]\d*)$/);
  if (!match) {
    await answerTelegramCallback(callback.id, 'Unsupported action');
    return NextResponse.json({ ok: true });
  }

  const [, action, rawPaymentId] = match;
  const paymentId = Number(rawPaymentId);
  if (!Number.isSafeInteger(paymentId)) {
    await answerTelegramCallback(callback.id, 'Invalid payment request');
    return NextResponse.json({ ok: true });
  }

  const status = action === 'approve' ? 'approved' : 'rejected';
  try {
    const payment = await reviewPayment(paymentId, status);
    const resolvedPayment = payment ||
      (await dbService.listPayments()).find((item) => item.id === paymentId);

    let resultText: string;
    if (!resolvedPayment) {
      resultText = `Payment #${paymentId} was not found.`;
    } else if (!payment) {
      resultText = `Payment #${paymentId} was already ${resolvedPayment.status}.`;
    } else {
      resultText = status === 'approved'
        ? `Payment #${paymentId} approved. ${payment.creditsCredited.toLocaleString()} credits were added.`
        : `Payment #${paymentId} rejected.`;
    }

    await answerTelegramCallback(callback.id, resultText);
    if (resolvedPayment) {
      await updateTelegramPaymentMessage(
        message,
        [
          `<b>${escapeTelegramHtml(resultText)}</b>`,
          `Reference: ${escapeTelegramHtml(resolvedPayment.transactionRef)}`,
          `Status: ${escapeTelegramHtml(resolvedPayment.status)}`,
        ].join('\n')
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram payment review failed:', error);
    await answerTelegramCallback(callback.id, 'Could not complete review. Please try again.');
    return NextResponse.json({ error: 'Payment review failed' }, { status: 500 });
  }
}
