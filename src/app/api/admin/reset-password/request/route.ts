import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbService } from '@/lib/db';
import {
  ALLOWED_ADMIN_EMAIL,
  assertAdminSessionSecretConfigured,
  hashAdminOtp,
  hashPassword,
} from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const REQUEST_WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 3;
const requestAttempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  );
}

function isRequestLimited(ip: string): boolean {
  const now = Date.now();
  const existing = requestAttempts.get(ip);
  if (!existing || existing.resetAt <= now) {
    requestAttempts.set(ip, { count: 1, resetAt: now + REQUEST_WINDOW_MS });
    return false;
  }
  if (existing.count >= MAX_REQUESTS_PER_WINDOW) return true;
  existing.count += 1;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    try {
      assertAdminSessionSecretConfigured();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Admin security is not configured. Set ADMIN_SESSION_SECRET in the hosting environment first.',
        },
        { status: 503, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    if (isRequestLimited(getClientIp(req))) {
      return NextResponse.json(
        { success: false, error: 'Too many code requests. Please wait 15 minutes before trying again.' },
        { status: 429, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    const adminUser = await dbService.findUserByEmail(ALLOWED_ADMIN_EMAIL);
    if (!adminUser) {
      const unusablePassword = await hashPassword(crypto.randomBytes(32).toString('hex'));
      await dbService.createUser({
        name: 'Bgern Admin',
        email: ALLOWED_ADMIN_EMAIL,
        password: unusablePassword,
        role: 'ADMIN',
      });
    }

    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
    const internalToken = crypto.randomBytes(32).toString('hex');
    await dbService.createPasswordReset(
      ALLOWED_ADMIN_EMAIL,
      internalToken,
      hashAdminOtp(code),
      10 * 60 * 1000
    );

    const emailResult = await sendPasswordResetEmail({
      to: ALLOWED_ADMIN_EMAIL,
      resetCode: code,
      expiresInMinutes: 10,
    });

    if (!emailResult.success) {
      console.error('[ADMIN OTP EMAIL ERROR]: Unable to deliver password reset code.');
      return NextResponse.json(
        { success: false, error: 'Could not send the verification code. Please check the email settings and try again.' },
        { status: 502, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'A 6-digit verification code was sent to the authorized admin email. It expires in 10 minutes.',
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    console.error(
      '[ADMIN OTP REQUEST ERROR]:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { success: false, error: 'Unable to request a verification code. Please try again later.' },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
}
