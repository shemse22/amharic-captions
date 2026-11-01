# Telegram payment approvals

The bot sends pending payment requests to one configured private Telegram chat.
The message includes the receipt when it is available and has **Approve** and
**Reject** buttons. Decisions use the same payment review flow as the admin
dashboard, notify the customer, and only apply while a request is pending.
Repeated button taps cannot credit a payment twice.

## Configure

1. Create a bot with Telegram's `@BotFather`, then open the new bot and send
   `/start`.
2. Find your Telegram numeric user/chat ID using `@userinfobot`.
3. In cPanel **Setup Node.js App**, add these environment variables without
   sharing their values in chat:
   - `TELEGRAM_BOT_TOKEN`: token from `@BotFather`
   - `TELEGRAM_ADMIN_CHAT_ID`: your numeric private Telegram chat ID
   - `TELEGRAM_WEBHOOK_SECRET`: a randomly generated 32+ character string
     containing only letters, numbers, `_`, or `-`
4. Keep `NEXT_PUBLIC_APP_URL` set to the public HTTPS origin, such as
   `https://bgern.com`.
5. Restart the Node.js app so it loads the new environment variables.
6. While signed in to the website as the admin, open the browser developer
   console and run:

   ```js
   fetch('/api/admin/telegram/setup', { method: 'POST' })
     .then(async (response) => ({ status: response.status, body: await response.json() }))
     .then(console.log)
   ```

   A successful response and a Telegram test message confirm setup. The setup
   request registers the HTTPS webhook; the bot token is never returned to the
   browser.

Only the configured private chat ID can use approval buttons. This integration
handles payment receipts and credit approvals; it does not manage video
approval requests.
