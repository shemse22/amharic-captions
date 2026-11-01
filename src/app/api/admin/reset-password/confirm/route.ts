import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db';
import {
  hashPassword,
  hashAdminOtp,
  createAuthToken,
  assertAdminSessionSecretConfigured,
  AUTH_COOKIE,
  ALLOWED_ADMIN_EMAIL,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_CODES = 5;
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  );
}

function isLocked(ip: string): boolean {
  const attempt = failedAttempts.get(ip);
  if (!attempt) return false;
  if (attempt.resetAt <= Date.now()) {
    failedAttempts.delete(ip);
    return false;
  }
  return attempt.count >= MAX_FAILED_CODES;
}

function recordFailedCode(ip: string): void {
  const now = Date.now();
  const current = failedAttempts.get(ip);
  if (!current || current.resetAt <= now) {
    failedAttempts.set(ip, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return;
  }
  current.count += 1;
}

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isLocked(ip)) {
    return json(
      { success: false, error: 'Too many incorrect codes. Please wait 15 minutes and request a new code.' },
      429
    );
  }

  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ success: false, error: 'Invalid request.' }, 400);
    }

    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!/^\d{6}$/.test(code)) {
      recordFailedCode(ip);
      return json({ success: false, error: 'Enter the 6-digit code from the admin email.' }, 400);
    }

    if (newPassword.length < 12) {
      return json({ success: false, error: 'New password must be at least 12 characters long.' }, 400);
    }

    const codeDigest = hashAdminOtp(code);
    const reset = await dbService.findPasswordReset(codeDigest);
    if (!reset || reset.email.toLowerCase() !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
      recordFailedCode(ip);
      return json(
        { success: false, error: 'Invalid or expired code. Request a new verification code.' },
        400
      );
    }

    const adminUser = await dbService.findUserByEmail(ALLOWED_ADMIN_EMAIL);
    if (!adminUser) {
      return json({ success: false, error: 'Could not find the admin account.' }, 404);
    }
    assertAdminSessionSecretConfigured();

    const hashedPassword = await hashPassword(newPassword);
    const updatedUser = await dbService.completePasswordReset(codeDigest, hashedPassword);
    if (!updatedUser) {
      return json({ success: false, error: 'Could not update the admin password.' }, 500);
    }

    if (!updatedUser.isAdmin || updatedUser.role !== 'ADMIN') {
      await dbService.updateUser(updatedUser.id, { isAdmin: true, role: 'ADMIN' });
    }

    const token = createAuthToken({ ...updatedUser, password: hashedPassword });
    const response = json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: 'ADMIN',
        isAdmin: true,
      },
      message: 'Admin password updated successfully.',
    });

    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    failedAttempts.delete(ip);
    return response;
  } catch (error) {
    console.error(
      '[ADMIN RESET CONFIRM ERROR]:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return json(
      { success: false, error: 'Password reset failed. Please try again or request a new code.' },
      500
    );
  }
}
