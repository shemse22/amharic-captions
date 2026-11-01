import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { dbService, UserRecord } from './db';
import { ALLOWED_ADMIN_EMAIL, ALLOWED_ADMIN_EMAILS, isAllowedAdminEmail } from './roles';

export { ALLOWED_ADMIN_EMAIL, ALLOWED_ADMIN_EMAILS };
export const AUTH_COOKIE = 'bgern_auth_token';
const JWT_SECRET = process.env.JWT_SECRET || 'bgern-amharic-captions-jwt-secret-key-2026';

export interface TokenPayload {
  userId: number;
  email: string;
  name: string;
  avatar?: string;
  role: 'USER' | 'ADMIN';
  isAdmin: boolean;
  authVersion?: string;
  exp?: number;
}

function getAdminAuthVersion(password?: string): string {
  return crypto.createHash('sha256').update(password || '').digest('hex');
}

export function assertAdminSessionSecretConfigured(): void {
  const adminSessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (
    process.env.NODE_ENV === 'production' &&
    (!adminSessionSecret || adminSessionSecret.length < 32)
  ) {
    throw new Error('ADMIN_SESSION_SECRET must be configured with at least 32 characters.');
  }
}

export function hashAdminOtp(code: string): string {
  assertAdminSessionSecretConfigured();
  return crypto
    .createHmac('sha256', process.env.ADMIN_SESSION_SECRET || JWT_SECRET)
    .update(code)
    .digest('hex');
}

// URL-safe Base64 encode
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// URL-safe Base64 decode
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

export function createAuthToken(user: UserRecord): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // 30 days
  const isAdmin = isAllowedAdminEmail(user.email);
  const adminSessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (isAdmin) assertAdminSessionSecretConfigured();
  const signingSecret = isAdmin ? adminSessionSecret || JWT_SECRET : JWT_SECRET;
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    role: isAdmin ? 'ADMIN' : 'USER',
    isAdmin,
    authVersion: isAdmin ? getAdminAuthVersion(user.password) : undefined,
    exp,
  };

  const encHeader = base64UrlEncode(JSON.stringify(header));
  const encPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', signingSecret)
    .update(`${encHeader}.${encPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encHeader}.${encPayload}.${signature}`;
}

export function verifyAuthToken(token: string): TokenPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encHeader, encPayload, signature] = parts;
    const payload = JSON.parse(base64UrlDecode(encPayload)) as TokenPayload;
    const adminSessionSecret = process.env.ADMIN_SESSION_SECRET;
    if (isAllowedAdminEmail(payload.email)) assertAdminSessionSecretConfigured();
    const signingSecret = isAllowedAdminEmail(payload.email)
      ? adminSessionSecret || JWT_SECRET
      : JWT_SECRET;
    const expectedSig = crypto
      .createHmac('sha256', signingSecret)
      .update(`${encHeader}.${encPayload}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signature !== expectedSig) {
      return null;
    }

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  try {
    if (!plain || !hash) return false;

    // Format: scrypt:<salt>:<hash>
    if (hash.startsWith('scrypt:')) {
      const parts = hash.split(':');
      if (parts.length !== 3) return false;
      const salt = parts[1];
      const originalHash = parts[2];
      const testHash = crypto.scryptSync(plain, salt, 64).toString('hex');
      return crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(originalHash, 'hex'));
    }

    // Direct plain text match
    if (plain === hash) return true;

    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export async function getSessionUser(): Promise<UserRecord | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;
    if (!token) return null;

    const payload = verifyAuthToken(token);
    if (!payload) return null;

    let user = await dbService.findUserById(payload.userId);
    if (!user && payload.email) {
      user = await dbService.findUserByEmail(payload.email);
    }
    if (!user) return null;
    if (isAllowedAdminEmail(user.email)) {
      const adminAccount = await dbService.findUserByEmail(user.email);
      if (payload.authVersion !== getAdminAuthVersion(adminAccount?.password)) return null;
    }
    return user;
  } catch {
    return null;
  }
}

export function isAdminUser(user: UserRecord | null): boolean {
  if (!user) return false;
  return isAllowedAdminEmail(user.email);
}
