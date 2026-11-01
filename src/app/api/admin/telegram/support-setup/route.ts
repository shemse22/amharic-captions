import { NextResponse } from 'next/server';
import { getSessionUser, isAdminUser } from '@/lib/auth';
import {
  getTelegramSupportConfig,
  registerTelegramWebhook,
  sendTelegramSupportMessage,
} from '@/lib/telegram';

export const dynamic = 'force-dynamic';

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

function getTelegramSetupErrorMessage(error: unknown): string {
  const detail = error instanceof Error ? error.message : '';
  const normalized = detail.toLowerCase();

  if (normalized.includes('unauthorized')) {
    return 'Telegram rejected the support bot token. Copy the current token from BotFather into TELEGRAM_SUPPORT_BOT_TOKEN and restart the app.';
  }
  if (normalized.includes('not found') || normalized.includes('chat_id')) {
    return 'Telegram could not find the admin chat. Open the support bot in Telegram, press Start, and verify TELEGRAM_SUPPORT_ADMIN_CHAT_ID is your numeric private chat ID.';
  }
  if (normalized.includes('webhook') || normalized.includes('url')) {
    return 'Telegram could not register the webhook URL. Confirm NEXT_PUBLIC_APP_URL is the deployed HTTPS domain and that the support webhook route is included in the deployed build.';
  }

  const safeDetail = detail
    .replace(/\b\d{5,}:[A-Za-z0-9_-]{20,}\b/g, '[redacted bot token]')
    .slice(0, 220);
  return safeDetail
    ? `Telegram setup failed: ${safeDetail}`
    : 'Telegram setup failed. Verify the bot token, HTTPS webhook URL, and server logs.';
}

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!isAdminUser(user)) {
      return json({ success: false, error: 'Sign in with the admin account before connecting the bot.' }, 403);
    }

    const { botToken, adminChatId, webhookSecret } = getTelegramSupportConfig();
    if (!botToken || !adminChatId || !webhookSecret) {
      return json(
        {
          success: false,
          error: 'Configure TELEGRAM_SUPPORT_BOT_TOKEN, TELEGRAM_SUPPORT_ADMIN_CHAT_ID, and TELEGRAM_SUPPORT_WEBHOOK_SECRET in the cPanel Node.js app settings, then restart the app.',
        },
        503
      );
    }
    if (!/^\d+$/.test(adminChatId)) {
      return json(
        { success: false, error: 'TELEGRAM_SUPPORT_ADMIN_CHAT_ID must be the numeric ID of your private Telegram chat.' },
        503
      );
    }
    if (!/^[A-Za-z0-9_-]{1,256}$/.test(webhookSecret)) {
      return json(
        { success: false, error: 'TELEGRAM_SUPPORT_WEBHOOK_SECRET must contain only letters, numbers, underscores, or hyphens (up to 256 characters).' },
        503
      );
    }

    let webhookUrl: string;
    try {
      const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || '');
      if (appUrl.protocol !== 'https:') throw new Error('HTTPS is required');
      webhookUrl = new URL('/api/telegram/support-webhook', appUrl).toString();
    } catch {
      return json(
        { success: false, error: 'Set NEXT_PUBLIC_APP_URL to your public HTTPS site URL (for example, https://bgern.com), then restart the app.' },
        503
      );
    }

    await registerTelegramWebhook(webhookUrl, botToken);

    try {
      await sendTelegramSupportMessage(
        adminChatId,
        'Bgern Support bot is connected. User questions will arrive here. Reply with /reply <user-chat-id> <message>.'
      );
      return json({
        success: true,
        message: 'Bgern Support bot is connected. Check Telegram for the setup confirmation.',
      });
    } catch (error) {
      console.warn(
        'Telegram support webhook was registered, but its confirmation message could not be delivered:',
        error
      );
      return json({
        success: true,
        message: 'The webhook is connected. To receive admin messages, open your support bot in Telegram and press Start. If you already did, verify TELEGRAM_SUPPORT_ADMIN_CHAT_ID.',
        warning: true,
      });
    }
  } catch (error) {
    const message = getTelegramSetupErrorMessage(error);
    console.error('Telegram support webhook registration failed:', message);
    return json(
      {
        success: false,
        error: message,
      },
      502
    );
  }
}
