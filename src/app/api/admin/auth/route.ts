import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db';
import {
  createAuthToken,
  getSessionUser,
  isAdminUser,
  hashPassword,
  comparePassword,
  AUTH_COOKIE,
  ALLOWED_ADMIN_EMAIL,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

function preventAuthResponseCaching(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
  return response;
}

// In-memory rate limiting for admin brute force protection
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remainingSec?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return { allowed: true };

  if (record.lockedUntil > now) {
    const remainingSec = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remainingSec };
  }

  if (record.lockedUntil <= now && record.lockedUntil > 0) {
    loginAttempts.delete(ip);
  }

  return { allowed: true };
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  record.count += 1;

  if (record.count >= 5) {
    record.lockedUntil = now + 5 * 60 * 1000; // 5 minute lockout
  }

  loginAttempts.set(ip, record);
}

function clearAttempts(ip: string) {
  loginAttempts.delete(ip);
}

// GET /api/admin/auth - Check admin session
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return preventAuthResponseCaching(
        NextResponse.json({ authenticated: false, isAdmin: false })
      );
    }
    const isAdm = isAdminUser(user);
    return preventAuthResponseCaching(
      NextResponse.json({
        authenticated: true,
        isAdmin: isAdm,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin,
        },
      })
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/auth - Password-only login for the authorized admin account
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

    // 1. Check Rate Limit
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Account temporarily locked for security. Please try again in ${rateCheck.remainingSec} seconds.`,
        },
        { status: 429 }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    const email = String(body.email || '').trim().toLowerCase();
    const password = typeof body.password === 'string' ? body.password : '';

    // 2. Strict Email Verification - ONLY thebigel16@gmail.com is allowed
    if (email !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        {
          error: `Access Denied: Only the authorized owner (${ALLOWED_ADMIN_EMAIL}) may access the Admin Console.`,
        },
        { status: 403 }
      );
    }

    // 3. Retrieve Admin User from DB
    const adminUser = await dbService.findUserByEmail(ALLOWED_ADMIN_EMAIL);
    if (!adminUser?.password || adminUser.password === 'GMAIL_AUTH') {
      return NextResponse.json(
        {
          error: 'An admin password has not been set. Use the email verification code to create one.',
          needsPasswordSetup: true,
        },
        { status: 400 }
      );
    }

    const isPasswordValid = await comparePassword(password, adminUser.password);
    if (!isPasswordValid) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { error: 'Incorrect admin password. Please try again or reset it using email verification.' },
        { status: 401 }
      );
    }

    // Login successful: reset rate limit attempts
    clearAttempts(ip);

    // Ensure admin role flags in DB
    if (!adminUser.isAdmin || adminUser.role !== 'ADMIN') {
      await dbService.updateUser(adminUser.id, { isAdmin: true, role: 'ADMIN' });
      adminUser.isAdmin = true;
      adminUser.role = 'ADMIN';
    }

    const token = createAuthToken(adminUser);
    const res = preventAuthResponseCaching(NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: 'ADMIN',
        isAdmin: true,
      },
      message: 'Admin authentication successful',
    }));

    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return res;
  } catch (err: any) {
    console.error('[ADMIN AUTH ERROR]:', err?.stack || err?.message || err);
    return NextResponse.json({ error: err.message || 'Authentication failed' }, { status: 500 });
  }
}

// DELETE /api/admin/auth - Admin Logout & Session Invalidation
export async function DELETE() {
  const res = preventAuthResponseCaching(NextResponse.json({
    success: true,
    message: 'Admin session terminated successfully',
  }));
  res.cookies.set(AUTH_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
  return res;
}

// PATCH /api/admin/auth - Update / Change Admin Password (for logged-in admin)
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.email.toLowerCase() !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { error: `Unauthorized. Only ${ALLOWED_ADMIN_EMAIL} may update the admin credentials.` },
        { status: 401 }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!newPassword || newPassword.length < 12) {
      return NextResponse.json(
        { error: 'New password must be at least 12 characters long.' },
        { status: 400 }
      );
    }

    if (!user.password || !currentPassword || !(await comparePassword(currentPassword, user.password))) {
      return NextResponse.json(
        { error: 'Current password is incorrect. Please check and try again.' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(newPassword);
    const updated = await dbService.updateUser(user.id, {
      password: hashedPassword,
      isAdmin: true,
      role: 'ADMIN',
    });

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update admin password in database.' }, { status: 500 });
    }

    const token = createAuthToken({ ...updated, password: hashedPassword });
    const response = preventAuthResponseCaching(NextResponse.json({
      success: true,
      message: 'Admin password updated successfully!',
    }));
    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (err: any) {
    console.error('[ADMIN PASSWORD UPDATE ERROR]:', err?.message || err);
    return NextResponse.json({ error: err.message || 'Password update failed' }, { status: 500 });
  }
}
