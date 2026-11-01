import type { PaymentRecord } from '@/lib/db';

const TELEGRAM_API = 'https://api.telegram.org';

interface TelegramApiResult<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

interface TelegramCallbackMessage {
  message_id: number;
  chat: { id: number };
  photo?: unknown[];
}

interface TelegramCallbackQuery {
  id: string;
  from: { id: number };
  message?: TelegramCallbackMessage;
  data?: string;
}

export interface TelegramUpdate {
  callback_query?: TelegramCallbackQuery;
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    from?: { id: number; first_name?: string; username?: string; is_bot?: boolean };
    text?: string;
    reply_to_message?: {
      text?: string;
      caption?: string;
    };
  };
}

export function getTelegramConfig() {
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID,
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET,
  };
}

export function getTelegramSupportConfig() {
  return {
    botToken: process.env.TELEGRAM_SUPPORT_BOT_TOKEN,
    adminChatId: process.env.TELEGRAM_SUPPORT_ADMIN_CHAT_ID,
    webhookSecret: process.env.TELEGRAM_SUPPORT_WEBHOOK_SECRET,
  };
}

async function telegramRequest<T>(
  method: string,
  payload: Record<string, unknown>,
  configuredBotToken?: string
): Promise<T> {
  const botToken = configuredBotToken ?? getTelegramConfig().botToken;
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN is not configured');

  let response: Response;
  try {
    response = await fetch(`${TELEGRAM_API}/bot${botToken}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error(`Telegram ${method} request could not reach the API`);
  }
  const result = (await response.json()) as TelegramApiResult<T>;
  if (!response.ok || !result.ok) {
    throw new Error(`Telegram ${method} failed: ${result.description || response.statusText}`);
  }
  return result.result as T;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<void> {
  await telegramRequest('sendMessage', {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  });
}

export async function registerTelegramWebhook(
  webhookUrl: string,
  configuredBotToken?: string
): Promise<void> {
  const webhookSecret = configuredBotToken
    ? getTelegramSupportConfig().webhookSecret
    : getTelegramConfig().webhookSecret;
  if (!webhookSecret) throw new Error('TELEGRAM_WEBHOOK_SECRET is not configured');
  await telegramRequest<boolean>('setWebhook', {
    url: webhookUrl,
    secret_token: webhookSecret,
    allowed_updates: ['callback_query', 'message'],
  }, configuredBotToken);
}

export async function sendTelegramSupportMessage(
  chatId: string | number,
  text: string
): Promise<void> {
  const { botToken } = getTelegramSupportConfig();
  if (!botToken) throw new Error('TELEGRAM_SUPPORT_BOT_TOKEN is not configured');
  await telegramRequest('sendMessage', {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  }, botToken);
}

export async function sendPendingPaymentToTelegram(
  payment: PaymentRecord
): Promise<boolean> {
  const { botToken, adminChatId, webhookSecret } = getTelegramConfig();
  if (!botToken && !adminChatId && !webhookSecret) return false;
  if (!botToken || !adminChatId || !webhookSecret) {
    throw new Error('Telegram payment approval is only partially configured');
  }

  const keyboard = {
    inline_keyboard: [[
      { text: 'Approve', callback_data: `payment:approve:${payment.id}` },
      { text: 'Reject', callback_data: `payment:reject:${payment.id}` },
    ]],
  };
  const lines = [
    `New payment request #${payment.id}`,
    `User: ${payment.userName || payment.userEmail || `User #${payment.userId}`}`,
    `Amount: ${payment.amountEtb} ETB`,
    `Plan: ${payment.planName}`,
    `Reference: ${payment.transactionRef}`,
    `Credits: ${payment.creditsCredited.toLocaleString()} (${payment.minutesCredited} minutes)`,
  ];
  const caption = lines.join('\n');
  const receiptUrl = getSafeReceiptUrl(payment.screenshotPath);

  if (receiptUrl) {
    try {
      await telegramRequest('sendPhoto', {
        chat_id: adminChatId,
        photo: receiptUrl,
        caption,
        reply_markup: keyboard,
      });
      return true;
    } catch (error) {
      console.warn('Telegram could not attach the payment receipt; sending request details only:', error);
    }
  }

  await telegramRequest('sendMessage', {
    chat_id: adminChatId,
    text: caption,
    reply_markup: keyboard,
    disable_web_page_preview: true,
  });
  return true;
}

function getSafeReceiptUrl(receiptPath?: string): string | null {
  if (!receiptPath) return null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return null;

  try {
    const base = new URL(appUrl);
    const receipt = new URL(receiptPath, base);
    if (base.protocol !== 'https:' || receipt.origin !== base.origin) return null;
    return receipt.toString();
  } catch {
    return null;
  }
}

export async function answerTelegramCallback(
  callbackQueryId: string,
  text: string
): Promise<void> {
  await telegramRequest('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text,
    show_alert: false,
  });
}

export async function updateTelegramPaymentMessage(
  message: TelegramCallbackMessage,
  text: string
): Promise<void> {
  const payload = {
    chat_id: message.chat.id,
    message_id: message.message_id,
    reply_markup: { inline_keyboard: [] },
    ...(message.photo?.length
      ? { caption: text, parse_mode: 'HTML' }
      : { text, parse_mode: 'HTML', disable_web_page_preview: true }),
  };
  await telegramRequest(
    message.photo?.length ? 'editMessageCaption' : 'editMessageText',
    payload
  );
}

export function escapeTelegramHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}
