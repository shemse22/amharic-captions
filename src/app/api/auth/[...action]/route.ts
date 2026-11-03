import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { dbService } from '@/lib/db';
import {
  ALLOWED_ADMIN_EMAIL,
  createAuthToken,
  hashPassword,
  comparePassword,
  getSessionUser,
  AUTH_COOKIE,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function preventAuthResponseCaching(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

async function handlePost(
  request: NextRequest,
  context: { params: Promise<{ action: string[] }> }
) {
  const { action } = await context.params;
  const subAction = action?.[0];

  try {
    // 1. REGISTER
    if (subAction === 'register') {
      const body = await request.json();
      const { email, password, name } = body;

      if (!email || !name) {
        return NextResponse.json({ error: 'Email address and User Name are required.' }, { status: 400 });
      }

      if (!password || typeof password !== 'string' || password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
      if (!isValidEmail) {
        return NextResponse.json(
          { error: 'Please enter a valid email address (e.g. name@gmail.com).' },
          { status: 400 }
        );
      }

      if (cleanEmail === ALLOWED_ADMIN_EMAIL.toLowerCase()) {
        return NextResponse.json(
          { error: 'The admin account cannot be created through public registration. Use /shems and email verification.' },
          { status: 403 }
        );
      }

      const existing = await dbService.findUserByEmail(cleanEmail);
      if (existing) {
        return NextResponse.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 400 });
      }

      const hashedPassword = await hashPassword(password);
      const isAdmin = cleanEmail === ALLOWED_ADMIN_EMAIL.toLowerCase();
      const gmailAvatar = `https://unavatar.io/google/${encodeURIComponent(cleanEmail)}?fallback=https%3A%2F%2Fui-avatars.com%2Fapi%2F%3Fname%3D${encodeURIComponent(name.trim())}%26background%3D0062FF%26color%3Dfff%26size%3D256%26bold%3Dtrue`;
      const user = await dbService.createUser({
        email: cleanEmail,
        name: name.trim(),
        password: hashedPassword,
        avatar: gmailAvatar,
        role: isAdmin ? 'ADMIN' : 'USER',
        minutes_balance: isAdmin ? 999 : 10,
        credits: isAdmin ? 999999 : 5000,
      });

      const token = createAuthToken(user);
      const publicUser = { ...user };
      delete publicUser.password;
      const res = NextResponse.json({ user: publicUser, success: true });
      res.cookies.set(AUTH_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return res;
    }

    // 2. LOGIN
    if (subAction === 'login') {
      const body = await request.json();
      const { email, password } = body;

      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
      if (!isValidEmail) {
        return NextResponse.json(
          { error: 'Please enter a valid email address (e.g. name@gmail.com).' },
          { status: 400 }
        );
      }

      if (cleanEmail === ALLOWED_ADMIN_EMAIL.toLowerCase()) {
        const adminUser = await dbService.findUserByEmail(ALLOWED_ADMIN_EMAIL);
        if (
          typeof password !== 'string' ||
          !password ||
          !adminUser?.password ||
          adminUser.password === 'GMAIL_AUTH' ||
          !(await comparePassword(password, adminUser.password))
        ) {
          return NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 401 });
        }

        const token = createAuthToken(adminUser);
        const publicAdminUser = { ...adminUser };
        delete publicAdminUser.password;
        const response = NextResponse.json({ user: publicAdminUser, success: true });
        response.cookies.set(AUTH_COOKIE, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30,
        });
        return response;
      }

      const user = await dbService.findUserByEmail(cleanEmail);
      if (!user) {
        return NextResponse.json({ error: 'No account found with this email. Please create an account.' }, { status: 404 });
      }

      if (user.password && !user.password.startsWith('GMAIL_')) {
        const matches = await comparePassword(password, user.password);
        if (!matches && user.password !== password) {
          return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 401 });
        }
      } else if (!user.password || user.password.startsWith('GMAIL_')) {
        return NextResponse.json(
          { error: 'This account was registered with Google. Please use "Continue with Google" above.' },
          { status: 400 }
        );
      }

      const token = createAuthToken(user);
      const responseUser = { ...user };
      delete responseUser.password;
      const res = NextResponse.json({ user: responseUser, success: true });
      res.cookies.set(AUTH_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return res;
    }

    // 3. GOOGLE / GMAIL LOGIN & SIGNUP
    if (subAction === 'google') {
      const clientId =
        process.env.GOOGLE_CLIENT_ID?.trim() ||
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
      if (!clientId) {
        return NextResponse.json(
          { error: 'Google sign-in is not configured yet.' },
          { status: 503 }
        );
      }

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: 'Invalid Google sign-in request.' }, { status: 400 });
      }
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return NextResponse.json({ error: 'Invalid Google sign-in request.' }, { status: 400 });
      }

      const credential = (body as Record<string, unknown>).credential;
      if (typeof credential !== 'string' || !credential) {
        return NextResponse.json(
          { error: 'Google did not provide a sign-in credential.' },
          { status: 400 }
        );
      }

      const googlePayload = await new OAuth2Client(clientId)
        .verifyIdToken({
          idToken: credential,
          audience: clientId,
        })
        .then((ticket) => ticket.getPayload())
        .catch(() => null);

      const email = googlePayload?.email?.trim().toLowerCase();
      if (!googlePayload?.sub || !email || googlePayload.email_verified !== true) {
        return NextResponse.json({ error: 'Use a verified Google account to sign in.' }, { status: 401 });
      }

      let user = await dbService.findUserByEmail(email);
      const name = googlePayload.name?.trim() || email.split('@')[0];
      const gmailAvatar = googlePayload.picture ||
        `https://unavatar.io/google/${encodeURIComponent(email)}?fallback=https%3A%2F%2Fui-avatars.com%2Fapi%2F%3Fname%3D${encodeURIComponent(name)}%26background%3D0062FF%26color%3Dfff%26size%3D256%26bold%3Dtrue`;
      let generatedAdminPassword: string | undefined;
      if (!user) {
        if (email === ALLOWED_ADMIN_EMAIL.toLowerCase()) {
          generatedAdminPassword = await hashPassword(crypto.randomBytes(32).toString('hex'));
        }
        user = await dbService.createUser({
          email,
          name,
          password: generatedAdminPassword,
          avatar: gmailAvatar,
          role: email === ALLOWED_ADMIN_EMAIL.toLowerCase() ? 'ADMIN' : 'USER',
          minutes_balance: email === ALLOWED_ADMIN_EMAIL.toLowerCase() ? 999 : 10,
          credits: email === ALLOWED_ADMIN_EMAIL.toLowerCase() ? 999999 : 5000,
        });
      } else if (!user.avatar) {
        user.avatar = gmailAvatar;
      }

      const tokenUser =
        email === ALLOWED_ADMIN_EMAIL.toLowerCase() && !user.password && generatedAdminPassword
          ? { ...user, password: generatedAdminPassword }
          : user;
      const token = createAuthToken(tokenUser);
      const responseUser = { ...user };
      if (email === ALLOWED_ADMIN_EMAIL.toLowerCase()) delete responseUser.password;
      const res = NextResponse.json({ user: responseUser, success: true });
      res.cookies.set(AUTH_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return res;
    }

    // 4. LOGOUT
    if (subAction === 'logout') {
      const res = NextResponse.json({ success: true });
      res.cookies.delete(AUTH_COOKIE);
      return res;
    }

    // 5. UPDATE PROFILE
    if (subAction === 'update' || subAction === 'profile') {
      const user = await getSessionUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { name, avatar } = body;
      const updatePayload: Parameters<typeof dbService.updateUser>[1] = {};
      if (name !== undefined) {
        if (!name.trim()) {
          return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
        }
        updatePayload.name = name.trim();
      }
      if (avatar !== undefined) {
        updatePayload.avatar = avatar;
      }

      const updated = await dbService.updateUser(user.id, updatePayload);
      if (!updated) {
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }

      const token = createAuthToken(updated);
      const res = NextResponse.json({ user: updated, success: true });
      res.cookies.set(AUTH_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return res;
    }

    return NextResponse.json({ error: 'Unknown auth action' }, { status: 404 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Authentication error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ action: string[] }> }
) {
  return preventAuthResponseCaching(await handlePost(request, context));
}

async function handleGet(
  _request: NextRequest,
  context: { params: Promise<{ action: string[] }> }
) {
  const { action } = await context.params;
  const subAction = action?.[0];

  if (subAction === 'me') {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ user: null, authenticated: false });
    }
    return NextResponse.json({ user, authenticated: true });
  }

  if (subAction === 'google') {
    const clientId =
      process.env.GOOGLE_CLIENT_ID?.trim() ||
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
    if (!clientId) {
      return NextResponse.json(
        { error: 'Google sign-in is not configured yet.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ clientId }, { headers: { 'Cache-Control': 'no-store' } });
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ action: string[] }> }
) {
  return preventAuthResponseCaching(await handleGet(request, context));
}
