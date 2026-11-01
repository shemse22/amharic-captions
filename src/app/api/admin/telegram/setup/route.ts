import { NextResponse } from 'next/server';
import { getSessionUser, isAdminUser } from '@/lib/auth';
import {
  getTelegramConfig,
  registerTelegramWebhook,
  sendTelegramMessage,
} from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function POST() {
  const user = await getSessionUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
  }

  const { botToken, adminChatId, webhookSecret } = getTelegramConfig();
  if (!botToken || !adminChatId || !webhookSecret) {
    return NextResponse.json(
      { error: 'Set TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID, and TELEGRAM_WEBHOOK_SECRET in the server environment first.' },
      { status: 503 }
    );
  }
  if (!/^\d+$/.test(adminChatId)) {
    return NextResponse.json(
      { error: 'TELEGRAM_ADMIN_CHAT_ID must be your numeric private chat ID.' },
      { status: 503 }
    );
  }
  if (!/^[A-Za-z0-9_-]{1,256}$/.test(webhookSecret)) {
    return NextResponse.json(
      { error: 'TELEGRAM_WEBHOOK_SECRET must contain 1–256 letters, digits, underscores, or hyphens.' },
      { status: 503 }
    );
  }

  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  let webhookUrl: string;
  try {
    const appUrl = new URL(configuredAppUrl || '');
    if (appUrl.protocol !== 'https:') throw new Error('HTTPS is required');
    webhookUrl = new URL('/api/telegram/webhook', appUrl).toString();
  } catch {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_APP_URL must be set to the public HTTPS site URL.' },
      { status: 503 }
    );
  }

  try {
    await registerTelegramWebhook(webhookUrl);
    await sendTelegramMessage(
      adminChatId,
      'Bgern payment approvals are connected. Pending payment requests will appear here. Send /stats anytime to view the admin metrics.'
    );
    return NextResponse.json({ success: true, message: 'Telegram payment approvals connected.' });
  } catch (error) {
    console.error('Telegram setup failed:', error);
    return NextResponse.json(
      { error: 'Telegram setup failed. Check the bot token, private chat ID, webhook URL, and server logs.' },
      { status: 502 }
    );
  }
}
