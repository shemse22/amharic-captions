import { spawn } from 'child_process';
import fs from 'fs';
import nodemailer from 'nodemailer';

interface SendPasswordResetEmailParams {
  to: string;
  resetCode: string;
  expiresInMinutes: number;
}

export async function sendPasswordResetEmail({
  to,
  resetCode,
  expiresInMinutes,
}: SendPasswordResetEmailParams): Promise<{ success: boolean }> {
  const fromAddress = process.env.SMTP_FROM || '"Bgern Security" <security@bgern.com>';
  const subject = '[Bgern] Admin password reset verification code';
  const text = [
    'Bgern Admin Security',
    '',
    `Your password reset verification code is: ${resetCode}`,
    '',
    `The code expires in ${expiresInMinutes} minutes and can only be used once.`,
    'If you did not request this change, ignore this email.',
    '',
    'Bgern Amharic AI Caption Studio',
    'https://bgern.com',
  ].join('\n');
  const html = `<!doctype html>
<html>
  <body style="font-family:Arial,sans-serif;color:#1e293b;background:#f8fafc;padding:24px">
    <main style="max-width:520px;margin:auto;background:white;border:1px solid #e2e8f0;border-radius:16px;padding:28px">
      <h1 style="font-size:22px">Bgern Admin Security</h1>
      <p>Your password reset verification code is:</p>
      <p style="font-family:monospace;font-size:32px;font-weight:bold;letter-spacing:8px;color:#0062ff">${resetCode}</p>
      <p>This code expires in <strong>${expiresInMinutes} minutes</strong> and can only be used once.</p>
      <p>If you did not request this change, ignore this email.</p>
      <p><a href="https://bgern.com">bgern.com</a></p>
    </main>
  </body>
</html>`;

  if (process.platform === 'linux' && fs.existsSync('/usr/sbin/sendmail')) {
    try {
      const boundary = `====_Bgern_${Date.now()}_====`;
      const rawEmail = [
        `From: ${fromAddress}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        text,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        html,
        '',
        `--${boundary}--`,
        '',
      ].join('\r\n');

      await new Promise<void>((resolve, reject) => {
        const sendmail = spawn('/usr/sbin/sendmail', ['-t', '-i']);
        sendmail.on('error', reject);
        sendmail.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`sendmail exited with code ${code}`));
        });
        sendmail.stdin.end(rawEmail);
      });

      return { success: true };
    } catch (error) {
      console.error(
        '[SENDMAIL ERROR]:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  try {
    const transporter =
      process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
        ? nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 465,
            secure:
              process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          })
        : nodemailer.createTransport({
            host: 'localhost',
            port: 25,
            tls: { rejectUnauthorized: false },
          });

    await transporter.sendMail({ from: fromAddress, to, subject, text, html });
    return { success: true };
  } catch (error) {
    console.error(
      '[SMTP ERROR]:',
      error instanceof Error ? error.message : 'SMTP is not configured'
    );
    return { success: false };
  }
}
