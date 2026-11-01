import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  getTelegramSupportConfig,
  sendTelegramSupportMessage,
  TelegramUpdate,
} from '@/lib/telegram';

export const dynamic = 'force-dynamic';

function isValidSecret(received: string | null, expected: string | undefined): boolean {
  if (!received || !expected) return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

function getAdminReply(text: string): { chatId: number; message: string } | null {
  const match = text.match(/^\/reply(?:@\w+)?\s+([1-9]\d*)\s+([\s\S]+)$/);
  if (!match) return null;

  const chatId = Number(match[1]);
  const message = match[2].trim();
  if (!Number.isSafeInteger(chatId) || !message || message.length > 3500) return null;
  return { chatId, message };
}

function getSupportRequestChatId(text: string): number | null {
  if (!text.startsWith('Bgern support request')) return null;

  const match = text.match(/^(?:🆔 )?Chat ID: ([1-9]\d*)$/m);
  if (!match) return null;

  const chatId = Number(match[1]);
  return Number.isSafeInteger(chatId) ? chatId : null;
}

export async function POST(request: NextRequest) {
  const { adminChatId, webhookSecret } = getTelegramSupportConfig();
  if (
    !adminChatId ||
    !/^\d+$/.test(adminChatId) ||
    !isValidSecret(
      request.headers.get('x-telegram-bot-api-secret-token'),
      webhookSecret
    )
  ) {
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

  const message = update.message;
  if (!message || message.chat.type !== 'private' || !message.from || message.from.is_bot) {
    return NextResponse.json({ ok: true });
  }

  const senderChatId = String(message.chat.id);
  const senderUserId = String(message.from.id);
  const text = message.text?.trim();

  try {
    if (text === '/id' || text === '/id@bgern_supportbot') {
      await sendTelegramSupportMessage(
        message.chat.id,
        `This Telegram chat ID is: ${senderChatId}\nSet TELEGRAM_SUPPORT_ADMIN_CHAT_ID to this number in cPanel only if this is your admin account.`
      );
      return NextResponse.json({ ok: true });
    }

    if (senderChatId === adminChatId && senderUserId === adminChatId) {
      if (!text || text === '/start' || text === '/help') {
        await sendTelegramSupportMessage(
          adminChatId,
          'Bgern Support inbox is ready.\n\nTo answer a request, tap or right-click the customer message, choose Reply, and send your response. You can also use /reply <user-chat-id> <message>.'
        );
        return NextResponse.json({ ok: true });
      }

      if (text.startsWith('/reply')) {
        const reply = getAdminReply(text);
        if (!reply) {
          await sendTelegramSupportMessage(
            adminChatId,
            'Use this format: /reply <user-chat-id> <message> (message up to 3500 characters).'
          );
          return NextResponse.json({ ok: true });
        }

        await sendTelegramSupportMessage(reply.chatId, reply.message);
        await sendTelegramSupportMessage(adminChatId, `Reply sent to user ${reply.chatId}.`);
        return NextResponse.json({ ok: true });
      }

      const repliedRequest = message.reply_to_message?.text || message.reply_to_message?.caption;
      const replyChatId = repliedRequest ? getSupportRequestChatId(repliedRequest) : null;
      if (replyChatId !== null) {
        if (!text || text.length > 3500) {
          await sendTelegramSupportMessage(
            adminChatId,
            'Please send a text reply of up to 3500 characters.'
          );
          return NextResponse.json({ ok: true });
        }

        await sendTelegramSupportMessage(replyChatId, text);
        await sendTelegramSupportMessage(adminChatId, '✅ Your reply was sent to the customer.');
        return NextResponse.json({ ok: true });
      }

      await sendTelegramSupportMessage(
        adminChatId,
        'To answer a customer, use Telegram’s Reply action on their support request and send your response.'
      );
      return NextResponse.json({ ok: true });
    }

    if (!text) {
      await sendTelegramSupportMessage(
        message.chat.id,
        'Please send your support question as a text message. Our team will reply here.'
      );
      return NextResponse.json({ ok: true });
    }

    if (text === '/start' || text === '/help') {
      await sendTelegramSupportMessage(
        message.chat.id,
        'Welcome to Bgern Support. Send your question here and our support team will reply as soon as possible.'
      );
      return NextResponse.json({ ok: true });
    }

    const userName = message.from.username
      ? `@${message.from.username}`
      : message.from.first_name?.replace(/\s+/g, ' ').trim() || 'Telegram user';
    const supportText = text.slice(0, 3000);
    await sendTelegramSupportMessage(
      adminChatId,
      `Bgern support request\n\n👤 From: ${userName}\n🆔 Chat ID: ${senderChatId}\n\n💬 Message:\n${supportText}\n\n↩️ Reply: use Telegram’s Reply action on this message to answer.`
    );
    await sendTelegramSupportMessage(
      message.chat.id,
      'Thanks, your message has been sent to Bgern Support. We will reply here as soon as possible.'
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram support message handling failed:', error);
    return NextResponse.json({ error: 'Could not process support message' }, { status: 502 });
  }
}
