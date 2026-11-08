import fs from 'fs';
import path from 'path';
import { isAllowedAdminEmail, normalizeAccountRole } from './roles';

// Lazy prisma loader - prevents webpack from bundling @prisma/client statically
function getPrisma(): any {
  try {
    if (process.env.USE_PRISMA !== 'true') return null;
    // Dynamic import path that webpack cannot resolve at build time
    const mod = '@prisma/' + 'client';
    const { PrismaClient } = require(mod);
    return new PrismaClient({ log: ['query'] });
  } catch {
    return null;
  }
}
let _prismaInstance: any = undefined;
function prisma(): any {
  if (_prismaInstance === undefined) {
    _prismaInstance = getPrisma();
  }
  return _prismaInstance;
}

const DB_FILE = path.join(process.cwd(), 'data', 'local_db.json');

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  password?: string;
  minutes_balance: number;
  credits: number;
  total_credits_granted?: number;
  isAdmin: boolean;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface PaymentRecord {
  id: number;
  userId: number;
  userEmail?: string;
  userName?: string;
  planName: 'LITE' | 'PLUS' | 'PRO' | 'MAX';
  amountEtb: number;
  transactionRef: string;
  paymentMethod?: string;
  chapaReference?: string;
  screenshotPath?: string;
  status: 'pending' | 'approved' | 'rejected';
  minutesCredited: number;
  creditsCredited: number;
  createdAt: string;
}

export interface VideoProjectRecord {
  id: number;
  userId: number;
  userEmail?: string;
  title: string;
  videoUrl?: string;
  durationSec: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  subtitlesJson?: any;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface PaymentMethodRecord {
  id: number;
  name: string;
  amharicName?: string;
  account: string;
  holder: string;
  color?: string;
  badge?: string;
  instruction?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostRecord {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: string;
  tags: string[];
  authorName: string;
  authorAvatar?: string;
  readTimeMinutes?: number;
  views?: number;
  status: 'published' | 'draft';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRecord {
  id: number;
  userId?: number;
  targetRole?: 'USER' | 'ADMIN' | 'ALL';
  type: 'PAYMENT_PENDING' | 'PAYMENT_APPROVED' | 'PAYMENT_REJECTED' | 'VIDEO_PENDING' | 'CREDIT_UPDATE' | 'SYSTEM';
  title: string;
  message: string;
  data?: {
    paymentId?: number;
    amountEtb?: number;
    planName?: string;
    minutesCredited?: number;
    creditsCredited?: number;
    transactionRef?: string;
    userName?: string;
    userEmail?: string;
    videoId?: number;
    videoTitle?: string;
    reason?: string;
  };
  isRead: boolean;
  createdAt: string;
}

export interface PasswordResetRecord {
  email: string;
  token: string;
  code: string;
  expiresAt: number;
}

// Resilient in-memory database with realistic seed data
class InMemoryDB {
  passwordResets: PasswordResetRecord[] = [];
  users: UserRecord[] = [
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@bgern.com',
      password: '$2a$10$AdminDefaultHashBgernSecret',
      minutes_balance: 999,
      credits: 999999,
      isAdmin: false,
      role: 'USER',
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
    {
      id: 2,
      name: 'Bigel (Lead Creator)',
      email: 'thebigel16@gmail.com',
      minutes_balance: 120,
      credits: 540000,
      isAdmin: true,
      role: 'ADMIN',
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    },
    {
      id: 3,
      name: 'Solomon Tekle (YouTuber)',
      email: 'solomon.t@gmail.com',
      minutes_balance: 34,
      credits: 180000,
      isAdmin: false,
      role: 'USER',
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: 4,
      name: 'Selamawit D. (TikToker)',
      email: 'selam.video@gmail.com',
      minutes_balance: 8,
      credits: 45000,
      isAdmin: false,
      role: 'USER',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 5,
      name: 'Natnael M. (Podcaster)',
      email: 'natnael.content@gmail.com',
      minutes_balance: 0,
      credits: 1200,
      isAdmin: false,
      role: 'USER',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ];

  payments: PaymentRecord[] = [
    {
      id: 1,
      userId: 3,
      userEmail: 'solomon.t@gmail.com',
      userName: 'Solomon Tekle (YouTuber)',
      planName: 'PLUS',
      amountEtb: 150,
      transactionRef: 'TB-894271954',
      screenshotPath: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
      status: 'pending',
      minutesCredited: 14,
      creditsCredited: 90000,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 2,
      userId: 4,
      userEmail: 'selam.video@gmail.com',
      userName: 'Selamawit D. (TikToker)',
      planName: 'PRO',
      amountEtb: 350,
      transactionRef: 'CBE-662910483',
      screenshotPath: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&auto=format&fit=crop&q=80',
      status: 'pending',
      minutesCredited: 40,
      creditsCredited: 250000,
      createdAt: new Date(Date.now() - 5400000).toISOString(),
    },
    {
      id: 3,
      userId: 5,
      userEmail: 'natnael.content@gmail.com',
      userName: 'Natnael M. (Podcaster)',
      planName: 'MAX',
      amountEtb: 750,
      transactionRef: 'TB-719304128',
      screenshotPath: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=80',
      status: 'pending',
      minutesCredited: 100,
      creditsCredited: 650000,
      createdAt: new Date(Date.now() - 10800000).toISOString(),
    },
    {
      id: 4,
      userId: 3,
      userEmail: 'solomon.t@gmail.com',
      userName: 'Solomon Tekle (YouTuber)',
      planName: 'PLUS',
      amountEtb: 150,
      transactionRef: 'CBE-118492019',
      screenshotPath: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&auto=format&fit=crop&q=80',
      status: 'approved',
      minutesCredited: 14,
      creditsCredited: 90000,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 5,
      userId: 4,
      userEmail: 'selam.video@gmail.com',
      userName: 'Selamawit D. (TikToker)',
      planName: 'LITE',
      amountEtb: 50,
      transactionRef: 'TB-339104821',
      screenshotPath: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
      status: 'approved',
      minutesCredited: 5,
      creditsCredited: 30000,
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
  ];

  videos: VideoProjectRecord[] = [];

  paymentMethods: PaymentMethodRecord[] = [
    {
      id: 1,
      name: 'Telebirr',
      amharicName: 'Telebirr',
      account: '0953756775',
      holder: 'Shemsedin Abate',
      color: 'bg-emerald-600',
      badge: 'Fastest',
      instruction: 'Send via Telebirr App or *127# to 0953756775 and enter the Transaction Reference (Tx Ref).',
      isActive: true,
      order: 1,
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
    {
      id: 2,
      name: 'Commercial Bank of Ethiopia (CBE)',
      amharicName: 'Commercial Bank of Ethiopia (CBE)',
      account: '1000209324702',
      holder: 'Shemsedin Abate',
      color: 'bg-purple-700',
      badge: 'CBE Birr / Mobile',
      instruction: 'Transfer via CBE Birr or CBE Mobile Banking to 1000209324702 and enter the transaction code.',
      isActive: true,
      order: 2,
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
    {
      id: 3,
      name: 'Bank of Abyssinia (BOA)',
      amharicName: 'Bank of Abyssinia (BOA)',
      account: '33045719',
      holder: 'Shemsedin Abate',
      color: 'bg-amber-600',
      badge: 'Apollo / Mobile',
      instruction: 'Transfer via Bank of Abyssinia Mobile Banking to 33045719.',
      isActive: true,
      order: 3,
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
    {
      id: 4,
      name: 'Awash Bank',
      amharicName: 'Awash Bank',
      account: '01425137466500',
      holder: 'Shemsedin Abate',
      color: 'bg-blue-600',
      badge: 'Direct Pay',
      instruction: 'Transfer via Awash Bank App to 01425137466500.',
      isActive: true,
      order: 4,
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
    {
      id: 5,
      name: 'MPessa',
      amharicName: 'MPessa',
      account: '0715359665',
      holder: 'Shemsedin',
      color: '#0062FF',
      badge: 'Active',
      instruction: '',
      isActive: true,
      order: 5,
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
  ];

  blogPosts: BlogPostRecord[] = [];
  notifications: NotificationRecord[] = [];

  nextUserId = 6;
  nextPaymentId = 6;
  nextVideoId = 4;
  nextPaymentMethodId = 5;
  nextBlogPostId = 1;
  nextNotificationId = 1;
  private lastLoadedMtime = 0;

  constructor() {
    this.load();
  }

  ensureLoaded() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const stat = fs.statSync(DB_FILE);
        if (stat.mtimeMs > this.lastLoadedMtime) {
          this.load();
        }
      }
    } catch {
      // Ignore stat error
    }
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const stat = fs.statSync(DB_FILE);
        this.lastLoadedMtime = stat.mtimeMs;
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const data = JSON.parse(raw);
        let normalizedUserRoles = false;
        if (data.users && Array.isArray(data.users)) {
          this.users = data.users.map((user: UserRecord) => {
            const normalized = normalizeAccountRole(user);
            if (user.isAdmin !== normalized.isAdmin || user.role !== normalized.role) {
              normalizedUserRoles = true;
            }
            return normalized;
          });
        }
        if (data.payments && Array.isArray(data.payments)) this.payments = data.payments;
        if (data.videos && Array.isArray(data.videos)) this.videos = data.videos;
        if (data.paymentMethods && Array.isArray(data.paymentMethods)) {
          let updatedMethods = false;
          this.paymentMethods = data.paymentMethods.map((m: PaymentMethodRecord) => {
            if (m.account === '0944093930' || m.holder === 'Bgern AI / Bgern') {
              updatedMethods = true;
              return { ...m, account: '0953756775', holder: 'Shemsedin Abate' };
            }
            if (m.account === '100043928174' || m.holder === 'Bgern Captions') {
              updatedMethods = true;
              return { ...m, account: '1000209324702', holder: 'Shemsedin Abate' };
            }
            if (m.account === '88912401' || m.holder === 'Bgern Media') {
              updatedMethods = true;
              return { ...m, account: '33045719', holder: 'Shemsedin Abate' };
            }
            if (m.account === '01304892185200' || m.holder === 'Bgern Tech') {
              updatedMethods = true;
              return { ...m, account: '01425137466500', holder: 'Shemsedin Abate' };
            }
            return m;
          });
          if (updatedMethods) this.save();
        }
        if (data.blogPosts && Array.isArray(data.blogPosts)) this.blogPosts = data.blogPosts;
        if (data.notifications && Array.isArray(data.notifications)) this.notifications = data.notifications;
        if (data.passwordResets && Array.isArray(data.passwordResets)) this.passwordResets = data.passwordResets;
        if (typeof data.nextUserId === 'number') this.nextUserId = data.nextUserId;
        if (typeof data.nextPaymentId === 'number') this.nextPaymentId = data.nextPaymentId;
        if (typeof data.nextVideoId === 'number') this.nextVideoId = data.nextVideoId;
        if (typeof data.nextPaymentMethodId === 'number') this.nextPaymentMethodId = data.nextPaymentMethodId;
        if (typeof data.nextBlogPostId === 'number') this.nextBlogPostId = data.nextBlogPostId;
        if (typeof data.nextNotificationId === 'number') this.nextNotificationId = data.nextNotificationId;

        // Auto-merge with backup to guard against any accidental deployment overwrite
        const backupFile = path.join(path.dirname(DB_FILE), 'local_db.backup.json');
        if (fs.existsSync(backupFile)) {
          try {
            const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
            if (Array.isArray(backupData.users)) {
              for (const bUser of backupData.users) {
                const existing = this.users.find(
                  (u) => u.id === bUser.id || u.email.toLowerCase() === bUser.email.toLowerCase()
                );
                if (!existing) {
                  this.users.push(bUser);
                } else if ((bUser.credits || 0) > (existing.credits || 0)) {
                  existing.credits = bUser.credits;
                  existing.minutes_balance = bUser.minutes_balance;
                }
              }
              if (backupData.nextUserId > this.nextUserId) this.nextUserId = backupData.nextUserId;
            }
          } catch {}
        }

        if (normalizedUserRoles) this.save();
      } else {
        this.save();
      }
    } catch (e) {
      console.warn('Failed to load local_db.json:', e);
    }
  }

  save() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = {
        users: this.users,
        payments: this.payments,
        videos: this.videos,
        paymentMethods: this.paymentMethods,
        blogPosts: this.blogPosts,
        notifications: this.notifications,
        passwordResets: this.passwordResets,
        nextUserId: this.nextUserId,
        nextPaymentId: this.nextPaymentId,
        nextVideoId: this.nextVideoId,
        nextPaymentMethodId: this.nextPaymentMethodId,
        nextBlogPostId: this.nextBlogPostId,
        nextNotificationId: this.nextNotificationId,
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
      try {
        const backupFile = path.join(dir, 'local_db.backup.json');
        fs.writeFileSync(backupFile, JSON.stringify(data, null, 2), 'utf8');
      } catch {}
      try {
        const stat = fs.statSync(DB_FILE);
        this.lastLoadedMtime = stat.mtimeMs;
      } catch {}
    } catch (e) {
      console.error('Failed to save to local_db.json:', e);
    }
  }
}

// Assign to prototype explicitly so existing instances get the method
(InMemoryDB.prototype as any).ensureLoaded = function() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const stat = fs.statSync(DB_FILE);
      if (stat.mtimeMs > (this.lastLoadedMtime || 0)) {
        this.load();
      }
    }
  } catch {}
};

const globalForDb = globalThis as unknown as { memoryDb?: InMemoryDB };
if (globalForDb.memoryDb) {
  try {
    Object.setPrototypeOf(globalForDb.memoryDb, InMemoryDB.prototype);
  } catch {}
}
export const memoryDb = globalForDb.memoryDb || new InMemoryDB();
if (!globalForDb.memoryDb) {
  globalForDb.memoryDb = memoryDb;
}
if (typeof (memoryDb as any).ensureLoaded !== 'function') {
  (memoryDb as any).ensureLoaded = (InMemoryDB.prototype as any).ensureLoaded;
}

export function syncDb() {
  try {
    if (typeof (memoryDb as any)?.ensureLoaded === 'function') {
      (memoryDb as any).ensureLoaded();
    } else if (typeof (memoryDb as any)?.load === 'function') {
      (memoryDb as any).load();
    }
  } catch {}
}

function normalizeMemoryUserRole(user: UserRecord): UserRecord {
  const normalized = normalizeAccountRole(user);
  if (user.isAdmin !== normalized.isAdmin || user.role !== normalized.role) {
    Object.assign(user, normalized);
    memoryDb.save();
  }
  return { ...normalized };
}

// Lazy prisma accessor - computed on first use
function p(): any { return prisma(); }

let prismaOnline = false;
let prismaChecked = false;

type PrismaUserRoleRecord = {
  id: number;
  email: string;
  isAdmin?: boolean | null;
  role?: string | null;
};

async function normalizePrismaUserRole<T extends PrismaUserRoleRecord>(user: T) {
  const normalized = normalizeAccountRole(user);
  if (
    Boolean(user.isAdmin) !== normalized.isAdmin ||
    user.role !== normalized.role
  ) {
    try {
      await p().user.update({
        where: { id: user.id },
        data: { isAdmin: normalized.isAdmin, role: normalized.role },
      });
    } catch (error) {
      console.error('Failed to enforce the admin email policy for a user:', error);
    }
  }
  return normalized;
}

async function isPrismaReady(): Promise<boolean> {
  if (prismaChecked) return prismaOnline;
  try {
    const client = p();
    if (process.env.USE_PRISMA !== 'true' || !process.env.DATABASE_URL || !client) {
      prismaChecked = true;
      prismaOnline = false;
      return false;
    }
    const pingPromise = client.$queryRaw`SELECT 1`.catch(() => null);
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 800)
    );
    const result = await Promise.race([pingPromise, timeoutPromise]);
    prismaOnline = result !== null;
    prismaChecked = true;
    return prismaOnline;
  } catch {
    prismaOnline = false;
    prismaChecked = true;
    return false;
  }
}

export const dbService = {
  // --- USERS ---
  async findUserByEmail(email: string): Promise<UserRecord | null> {
    syncDb();
    const normalized = email.toLowerCase().trim();
    try {
      if (await isPrismaReady() && p() && p().user) {
        const user = await p().user.findUnique({
          where: { email: normalized },
        });
        if (user) {
          return normalizePrismaUserRole({
            id: user.id,
            name: user.name,
            email: user.email,
            password: user.password,
            minutes_balance: user.minutes_balance || 10,
            credits: user.credits || 300000,
            isAdmin: user.isAdmin,
            role: user.role,
            createdAt: user.createdAt?.toISOString?.() || new Date().toISOString(),
          });
        }
      }
    } catch {
      // Fallback
    }

    const found = memoryDb.users.find((u) => u.email.toLowerCase() === normalized);
    return found ? normalizeMemoryUserRole(found) : null;
  },

  async findUserById(id: number): Promise<UserRecord | null> {
    syncDb();
    try {
      if (await isPrismaReady() && p() && p().user) {
        const user = await p().user.findUnique({ where: { id } });
        if (user) {
          return normalizePrismaUserRole({
            id: user.id,
            name: user.name,
            email: user.email,
            minutes_balance: user.minutes_balance || 10,
            credits: user.credits || 300000,
            isAdmin: user.isAdmin,
            role: user.role,
            createdAt: user.createdAt?.toISOString?.() || new Date().toISOString(),
          });
        }
      }
    } catch {
      // Fallback
    }

    const found = memoryDb.users.find((u) => u.id === id);
    return found ? normalizeMemoryUserRole(found) : null;
  },

  async createUser(data: {
    name: string;
    email: string;
    avatar?: string;
    password?: string;
    role?: 'USER' | 'ADMIN';
    minutes_balance?: number;
    credits?: number;
  }): Promise<UserRecord> {
    const normalized = data.email.toLowerCase().trim();
    const isAdmin = isAllowedAdminEmail(normalized);
    const role: 'USER' | 'ADMIN' = isAdmin ? 'ADMIN' : 'USER';
    const minutes = data.minutes_balance ?? (isAdmin ? 999 : 0);
    const credits = data.credits ?? (isAdmin ? 999999 : 0);
    const avatar = data.avatar || `https://unavatar.io/google/${encodeURIComponent(normalized)}?fallback=https%3A%2F%2Fui-avatars.com%2Fapi%2F%3Fname%3D${encodeURIComponent(data.name)}%26background%3D0062FF%26color%3Dfff%26size%3D256%26bold%3Dtrue`;

    try {
      if (await isPrismaReady() && p() && p().user) {
        const created = await p().user.create({
          data: {
            name: data.name,
            email: normalized,
            password: data.password || 'GMAIL_AUTH',
            minutes_balance: minutes,
            isAdmin,
            role,
          },
        });
        return {
          id: created.id,
          name: created.name,
          email: created.email,
          avatar,
          minutes_balance: created.minutes_balance || minutes,
          credits: credits,
          isAdmin,
          role,
          createdAt: created.createdAt?.toISOString?.() || new Date().toISOString(),
        };
      }
    } catch {
      // Fallback
    }

    const newUser: UserRecord = {
      id: memoryDb.nextUserId++,
      name: data.name,
      email: normalized,
      avatar,
      password: data.password,
      minutes_balance: minutes,
      credits: credits,
      isAdmin,
      role,
      createdAt: new Date().toISOString(),
    };
    memoryDb.users.push(newUser);
    memoryDb.save();
    return newUser;
  },

  async updateUser(id: number, data: Partial<UserRecord>): Promise<UserRecord | null> {
    try {
      if (await isPrismaReady() && p() && p().user) {
        const current = await p().user.findUnique({ where: { id } });
        if (!current) return null;
        const roleFlags = normalizeAccountRole({ email: current.email });
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.avatar !== undefined) updateData.avatar = data.avatar;
        if (data.minutes_balance !== undefined) updateData.minutes_balance = data.minutes_balance;
        if (data.password !== undefined) updateData.password = data.password;
        if (data.credits !== undefined) updateData.credits = data.credits;
        updateData.isAdmin = roleFlags.isAdmin;
        updateData.role = roleFlags.role;
        const updated = await p().user.update({
          where: { id },
          data: updateData,
        });
        if (updated) {
          return normalizePrismaUserRole({
            id: updated.id,
            name: updated.name,
            email: updated.email,
            avatar: updated.avatar || data.avatar,
            minutes_balance: updated.minutes_balance || 10,
            credits: updated.credits || 300000,
            isAdmin: updated.isAdmin,
            role: updated.role,
            createdAt: updated.createdAt?.toISOString?.() || new Date().toISOString(),
          });
        }
      }
    } catch {
      // Fallback
    }

    const idx = memoryDb.users.findIndex((u) => u.id === id);
    if (idx >= 0) {
      memoryDb.users[idx] = normalizeAccountRole({ ...memoryDb.users[idx], ...data });
      memoryDb.save();
      return { ...memoryDb.users[idx] };
    }
    return null;
  },

  // --- VIDEOS & ADMIN APPROVAL (7-Day Retention Policy) ---
  async listVideos(filterUserId?: number): Promise<VideoProjectRecord[]> {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const cutoffDate = new Date(now - SEVEN_DAYS_MS);

    // Enforce 7-day retention auto-cleanup on in-memory / local database
    const initialCount = memoryDb.videos.length;
    memoryDb.videos = memoryDb.videos.filter((v) => new Date(v.createdAt).getTime() >= cutoffDate.getTime());
    if (memoryDb.videos.length !== initialCount) {
      memoryDb.save();
    }

    try {
      if (await isPrismaReady() && p() && p().videoProject) {
        const where: any = {
          createdAt: { gte: cutoffDate },
        };
        if (filterUserId) {
          where.userId = filterUserId;
        }
        const rows = await p().videoProject.findMany({
          where,
          include: { user: true },
          orderBy: { createdAt: 'desc' },
        });
        if (rows && rows.length > 0) {
          return rows.map((r: any) => {
            const createdTime = new Date(r.createdAt || now).getTime();
            return {
              id: r.id,
              userId: r.userId,
              userEmail: r.user?.email,
              title: r.title,
              videoUrl: r.videoUrl || undefined,
              durationSec: r.durationSec,
              status: r.status as any,
              rejectionReason: r.rejectionReason || undefined,
              subtitlesJson: r.subtitlesJson,
              createdAt: r.createdAt?.toISOString?.() || new Date().toISOString(),
              updatedAt: r.updatedAt?.toISOString?.() || new Date().toISOString(),
              expiresAt: new Date(createdTime + SEVEN_DAYS_MS).toISOString(),
            };
          });
        }
      }
    } catch {
      // Fallback
    }

    let result = memoryDb.videos;
    if (filterUserId) {
      result = result.filter((v) => v.userId === filterUserId);
    }
    return result
      .map((v) => {
        const createdTime = new Date(v.createdAt).getTime();
        return {
          ...v,
          expiresAt: v.expiresAt || new Date(createdTime + SEVEN_DAYS_MS).toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createVideoProject(data: {
    userId: number;
    title: string;
    videoUrl?: string;
    durationSec?: number;
    subtitlesJson?: any;
    status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  }): Promise<VideoProjectRecord> {
    const user = await this.findUserById(data.userId);
    const initialStatus = data.status || 'APPROVED';
    const subs = data.subtitlesJson
      ? (typeof data.subtitlesJson === 'string' ? data.subtitlesJson : JSON.stringify(data.subtitlesJson))
      : undefined;

    try {
      if (await isPrismaReady() && p() && p().videoProject) {
        const created = await p().videoProject.create({
          data: {
            userId: data.userId,
            title: data.title,
            videoUrl: data.videoUrl,
            durationSec: data.durationSec || 0,
            subtitlesJson: subs,
            status: initialStatus,
          },
        });
        return {
          id: created.id,
          userId: created.userId,
          userEmail: user?.email,
          title: created.title,
          videoUrl: created.videoUrl || undefined,
          durationSec: created.durationSec,
          status: (created.status as any) || initialStatus,
          subtitlesJson: created.subtitlesJson || subs,
          createdAt: created.createdAt?.toISOString?.() || new Date().toISOString(),
          updatedAt: created.updatedAt?.toISOString?.() || new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
      }
    } catch {
      // Fallback
    }

    const newVideo: VideoProjectRecord = {
      id: memoryDb.nextVideoId++,
      userId: data.userId,
      userEmail: user?.email,
      title: data.title,
      videoUrl: data.videoUrl,
      durationSec: data.durationSec || 0,
      subtitlesJson: subs,
      status: initialStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    memoryDb.videos.unshift(newVideo);
    memoryDb.save();
    return newVideo;
  },

  async updateVideoSubtitles(
    videoId: number,
    subtitlesJson: any,
    durationSec?: number
  ): Promise<VideoProjectRecord | null> {
    const subs = subtitlesJson
      ? (typeof subtitlesJson === 'string' ? subtitlesJson : JSON.stringify(subtitlesJson))
      : undefined;

    try {
      if (await isPrismaReady() && p() && p().videoProject) {
        const updateData: any = { updatedAt: new Date() };
        if (subs !== undefined) updateData.subtitlesJson = subs;
        if (durationSec) updateData.durationSec = durationSec;

        const updated = await p().videoProject.update({
          where: { id: videoId },
          data: updateData,
        });
        if (updated) {
          return {
            id: updated.id,
            userId: updated.userId,
            title: updated.title,
            videoUrl: updated.videoUrl || undefined,
            durationSec: updated.durationSec,
            status: updated.status,
            subtitlesJson: updated.subtitlesJson,
            createdAt: updated.createdAt?.toISOString?.() || new Date().toISOString(),
            updatedAt: updated.updatedAt?.toISOString?.() || new Date().toISOString(),
            expiresAt: new Date(new Date(updated.createdAt || Date.now()).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          };
        }
      }
    } catch {
      // Fallback
    }

    const v = memoryDb.videos.find((x) => x.id === videoId);
    if (!v) return null;
    if (subs !== undefined) v.subtitlesJson = subs;
    if (durationSec) v.durationSec = durationSec;
    v.updatedAt = new Date().toISOString();
    memoryDb.save();
    return { ...v };
  },

  async updateVideoStatus(
    videoId: number,
    status: 'APPROVED' | 'REJECTED',
    rejectionReason?: string
  ): Promise<VideoProjectRecord | null> {
    try {
      if (await isPrismaReady() && p() && p().videoProject) {
        const updated = await p().videoProject.update({
          where: { id: videoId },
          data: { status, rejectionReason },
        });
        if (updated) {
          return {
            id: updated.id,
            userId: updated.userId,
            title: updated.title,
            durationSec: updated.durationSec,
            status: updated.status,
            rejectionReason: updated.rejectionReason || undefined,
            createdAt: updated.createdAt?.toISOString?.() || new Date().toISOString(),
            updatedAt: updated.updatedAt?.toISOString?.() || new Date().toISOString(),
          };
        }
      }
    } catch {
      // Fallback
    }

    const v = memoryDb.videos.find((x) => x.id === videoId);
    if (!v) return null;
    v.status = status;
    v.rejectionReason = rejectionReason;
    v.updatedAt = new Date().toISOString();
    memoryDb.save();
    return { ...v };
  },

  async deleteVideoProject(videoId: number, userId?: number): Promise<boolean> {
    try {
      if (await isPrismaReady() && p() && p().videoProject) {
        await p().videoProject.delete({ where: { id: videoId } });
        return true;
      }
    } catch {
      // Fallback
    }

    const idx = memoryDb.videos.findIndex(
      (x) => x.id === videoId && (!userId || x.userId === userId)
    );
    if (idx >= 0) {
      memoryDb.videos.splice(idx, 1);
      memoryDb.save();
      return true;
    }
    return false;
  },

  // --- PAYMENTS & ETB PLANS ---
  async listPayments(): Promise<PaymentRecord[]> {
    syncDb();
    try {
      if (await isPrismaReady() && p() && p().payment) {
        const rows = await p().payment.findMany({
          include: { user: true },
          orderBy: { createdAt: 'desc' },
        });
        if (rows && rows.length > 0) {
          return rows.map((row: any) => ({
            id: row.id,
            userId: row.userId,
            userEmail: row.user?.email,
            userName: row.user?.name,
            planName: (row.planName || 'PLUS') as any,
            amountEtb: Number(row.amountEtb),
            transactionRef: row.transactionRef,
            paymentMethod: row.paymentMethod || 'TELEBIRR',
            chapaReference: row.chapaReference || undefined,
            screenshotPath: row.screenshotPath || undefined,
            status: row.status as any,
            minutesCredited: row.minutesCredited,
            creditsCredited: row.creditsCredited || row.minutesCredited * 3000,
            createdAt: row.createdAt?.toISOString?.() || new Date().toISOString(),
          }));
        }
      }
    } catch {
      // Fallback
    }

    return [...memoryDb.payments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async findPaymentByTxRef(transactionRef: string): Promise<PaymentRecord | null> {
    const cleanRef = transactionRef.trim();
    try {
      if (await isPrismaReady() && p() && p().payment) {
        const row = await p().payment.findUnique({
          where: { transactionRef: cleanRef },
          include: { user: true },
        });
        if (row) {
          return {
            id: row.id,
            userId: row.userId,
            userEmail: row.user?.email,
            userName: row.user?.name,
            planName: (row.planName || 'PLUS') as any,
            amountEtb: Number(row.amountEtb),
            transactionRef: row.transactionRef,
            paymentMethod: row.paymentMethod || 'TELEBIRR',
            chapaReference: row.chapaReference || undefined,
            screenshotPath: row.screenshotPath || undefined,
            status: row.status as any,
            minutesCredited: row.minutesCredited,
            creditsCredited: row.creditsCredited || row.minutesCredited * 3000,
            createdAt: row.createdAt?.toISOString?.() || new Date().toISOString(),
          };
        }
      }
    } catch {
      // Fallback
    }

    syncDb();
    const mem = memoryDb.payments.find(
      (x) => x.transactionRef.toLowerCase() === cleanRef.toLowerCase()
    );
    return mem ? { ...mem } : null;
  },

  async createPayment(data: {
    userId: number;
    userEmail?: string;
    userName?: string;
    planName: 'LITE' | 'PLUS' | 'PRO' | 'MAX';
    amountEtb: number;
    transactionRef: string;
    paymentMethod?: string;
    chapaReference?: string;
    screenshotPath?: string;
    minutesCredited: number;
    creditsCredited: number;
    status?: 'pending' | 'approved' | 'rejected';
  }): Promise<PaymentRecord> {
    syncDb();
    let user = await this.findUserById(data.userId);
    if ((!user || (user.id === 1 && data.userEmail && data.userEmail.toLowerCase() !== user.email.toLowerCase())) && data.userEmail) {
      const byEmail = await this.findUserByEmail(data.userEmail);
      if (byEmail) {
        user = byEmail;
      }
    }
    const finalUserId = user ? user.id : data.userId;
    const finalUserEmail = user?.email || data.userEmail;
    const finalUserName = user?.name || data.userName;
    const initialStatus = data.status || 'pending';
    const method = data.paymentMethod || 'TELEBIRR';

    try {
      if (await isPrismaReady() && p() && p().payment) {
        const created = await p().payment.create({
          data: {
            userId: finalUserId,
            planName: data.planName,
            amountEtb: data.amountEtb,
            transactionRef: data.transactionRef,
            paymentMethod: method,
            chapaReference: data.chapaReference,
            screenshotPath: data.screenshotPath || '',
            status: initialStatus,
            minutesCredited: data.minutesCredited,
            creditsCredited: data.creditsCredited,
          },
        });

        if (initialStatus === 'approved') {
          await p().user.update({
            where: { id: finalUserId },
            data: {
              minutes_balance: { increment: data.minutesCredited },
              credits: { increment: data.creditsCredited },
            },
          });
        }

        const record: PaymentRecord = {
          id: created.id,
          userId: created.userId,
          userEmail: finalUserEmail,
          userName: finalUserName,
          planName: data.planName,
          amountEtb: Number(created.amountEtb),
          transactionRef: created.transactionRef,
          paymentMethod: method,
          chapaReference: data.chapaReference,
          screenshotPath: created.screenshotPath || undefined,
          status: initialStatus,
          minutesCredited: created.minutesCredited,
          creditsCredited: data.creditsCredited,
          createdAt: created.createdAt?.toISOString?.() || new Date().toISOString(),
        };
        memoryDb.payments.unshift(record);
        memoryDb.save();
        return record;
      }
    } catch {
      // Fallback
    }

    const newPayment: PaymentRecord = {
      id: memoryDb.nextPaymentId++,
      userId: finalUserId,
      userEmail: finalUserEmail,
      userName: finalUserName,
      planName: data.planName,
      amountEtb: data.amountEtb,
      transactionRef: data.transactionRef,
      paymentMethod: method,
      chapaReference: data.chapaReference,
      screenshotPath: data.screenshotPath,
      status: initialStatus,
      minutesCredited: data.minutesCredited,
      creditsCredited: data.creditsCredited,
      createdAt: new Date().toISOString(),
    };

    if (initialStatus === 'approved') {
      const u = memoryDb.users.find((x) => x.id === finalUserId);
      if (u) {
        u.minutes_balance += data.minutesCredited;
        u.credits += data.creditsCredited;
      }
    }

    memoryDb.payments.unshift(newPayment);
    memoryDb.save();
    return newPayment;
  },

  async updatePaymentStatus(
    paymentId: number,
    status: 'approved' | 'rejected'
  ): Promise<PaymentRecord | null> {
    syncDb();
    if (await isPrismaReady() && p() && p().payment) {
      const updated = await p().$transaction(async (tx: any) => {
        const pending = await tx.payment.findFirst({
          where: { id: paymentId, status: 'pending' },
        });
        if (!pending) return null;

        const transition = await tx.payment.updateMany({
          where: { id: paymentId, status: 'pending' },
          data: { status },
        });
        if (transition.count !== 1) return null;

        if (status === 'approved') {
          await tx.user.update({
            where: { id: pending.userId },
            data: {
              minutes_balance: { increment: pending.minutesCredited },
              credits: {
                increment: pending.creditsCredited || pending.minutesCredited * 30000,
              },
            },
          });
        }

        return tx.payment.findUnique({
          where: { id: paymentId },
          include: { user: true },
        });
      });

      if (!updated) return null;
      return {
        id: updated.id,
        userId: updated.userId,
        userEmail: updated.user?.email,
        userName: updated.user?.name,
        planName: (updated.planName || 'PLUS') as any,
        amountEtb: Number(updated.amountEtb),
        transactionRef: updated.transactionRef,
        paymentMethod: updated.paymentMethod || 'TELEBIRR',
        chapaReference: updated.chapaReference || undefined,
        screenshotPath: updated.screenshotPath || undefined,
        status: updated.status as any,
        minutesCredited: updated.minutesCredited,
        creditsCredited: updated.creditsCredited || updated.minutesCredited * 30000,
        createdAt: updated.createdAt?.toISOString?.() || new Date().toISOString(),
      };
    }

    const payment = memoryDb.payments.find(
      (record) => record.id === paymentId && record.status === 'pending'
    );
    if (!payment) return null;

    let user = memoryDb.users.find((record) => record.id === payment.userId);
    if (
      (!user || (user.id === 1 && payment.userEmail && payment.userEmail.toLowerCase() !== user.email.toLowerCase())) &&
      payment.userEmail
    ) {
      user = memoryDb.users.find(
        (record) => record.email.toLowerCase() === payment.userEmail?.toLowerCase()
      );
      if (user) payment.userId = user.id;
    }

    if (status === 'approved' && !user) return null;

    payment.status = status;
    if (status === 'approved' && user) {
      user.minutes_balance += payment.minutesCredited;
      user.credits += payment.creditsCredited;
      user.total_credits_granted =
        (user.total_credits_granted || user.credits - payment.creditsCredited) +
        payment.creditsCredited;
    }
    memoryDb.save();
    return { ...payment };
  },

  async approvePaymentByTxRef(transactionRef: string): Promise<PaymentRecord | null> {
    const mem = memoryDb.payments.find(
      (x) => x.transactionRef.toLowerCase() === transactionRef.trim().toLowerCase()
    );
    if (mem) {
      return this.updatePaymentStatus(mem.id, 'approved');
    }

    try {
      if (await isPrismaReady() && p() && p().payment) {
        const found = await p().payment.findUnique({
          where: { transactionRef: transactionRef.trim() },
        });
        if (found) {
          return this.updatePaymentStatus(found.id, 'approved');
        }
      }
    } catch {}

    return null;
  },

  // --- USER MANAGEMENT (ADMIN) ---
  async listUsers(): Promise<UserRecord[]> {
    syncDb();
    try {
      if (await isPrismaReady() && p() && p().user) {
        const rows = await p().user.findMany({
          orderBy: { createdAt: 'desc' },
        });
        if (rows && rows.length > 0) {
          return Promise.all(rows.map((u: any) => normalizePrismaUserRole({
            id: u.id,
            name: u.name,
            email: u.email,
            avatar: u.avatar,
            minutes_balance: u.minutes_balance || 10,
            credits: u.credits || 5000,
            isAdmin: u.isAdmin,
            role: u.role,
            createdAt: u.createdAt?.toISOString?.() || new Date().toISOString(),
          })));
        }
      }
    } catch {
      // Fallback
    }

    return [...memoryDb.users]
      .map(normalizeMemoryUserRole)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async updateUserCredits(
    userId: number,
    creditsDelta: number,
    minutesDelta: number
  ): Promise<UserRecord | null> {
    syncDb();
    const mem = memoryDb.users.find((u) => u.id === userId);
    if (mem) {
      mem.credits = Math.max(0, Number((mem.credits + creditsDelta).toFixed(0)));
      mem.minutes_balance = Math.max(0, Number((mem.minutes_balance + minutesDelta).toFixed(2)));
      memoryDb.save();
    }

    try {
      if (await isPrismaReady() && p() && p().user) {
        const updateData: any = {};
        if (creditsDelta !== 0) {
          updateData.credits = mem ? mem.credits : { increment: creditsDelta };
        }
        if (minutesDelta !== 0) {
          updateData.minutes_balance = mem ? mem.minutes_balance : { increment: minutesDelta };
        }

        if (Object.keys(updateData).length === 0) {
          const current = await p().user.findUnique({ where: { id: userId } });
          if (!current) return mem ? normalizeMemoryUserRole(mem) : null;
          return normalizePrismaUserRole({
            id: current.id,
            name: current.name,
            email: current.email,
            minutes_balance: current.minutes_balance || 0,
            credits: current.credits || 0,
            total_credits_granted: mem?.total_credits_granted,
            isAdmin: current.isAdmin,
            role: current.role,
            createdAt: current.createdAt?.toISOString?.() || new Date().toISOString(),
          });
        }

        const updated = await p().user.update({
          where: { id: userId },
          data: updateData,
        });
        if (updated) {
          return normalizePrismaUserRole({
            id: updated.id,
            name: updated.name,
            email: updated.email,
            minutes_balance: updated.minutes_balance || 0,
            credits: updated.credits || 0,
            total_credits_granted: mem?.total_credits_granted,
            isAdmin: updated.isAdmin,
            role: updated.role,
            createdAt: updated.createdAt?.toISOString?.() || new Date().toISOString(),
          });
        }
      }
    } catch {
      // Fallback
    }

    return mem ? normalizeMemoryUserRole(mem) : null;
  },

  getUserTotalCreditsGranted(user: UserRecord): number {
    syncDb();
    const approvedPayments = memoryDb.payments.filter(
      (p) =>
        (p.userId === user.id ||
          (p.userEmail && p.userEmail.toLowerCase() === user.email.toLowerCase())) &&
        p.status === 'approved'
    );
    const paymentCredits = approvedPayments.reduce(
      (sum, p) =>
        sum + (p.creditsCredited || (p.minutesCredited ? p.minutesCredited * 30000 : 0)),
      0
    );
    return Math.max(user.credits, user.total_credits_granted || 0, paymentCredits);
  },

  async toggleUserRole(userId: number): Promise<UserRecord | null> {
    syncDb();
    let target = memoryDb.users.find((u) => u.id === userId) || null;
    try {
      if (await isPrismaReady() && p() && p().user) {
        target = await p().user.findUnique({ where: { id: userId } }) || target;
      }
    } catch {
      // Fallback
    }

    if (!target) return null;
    if (!isAllowedAdminEmail(target.email)) {
      await this.updateUser(userId, { isAdmin: false, role: 'USER' });
      return null;
    }

    return this.updateUser(userId, { isAdmin: true, role: 'ADMIN' });
  },

  async deleteUser(userId: number): Promise<boolean> {
    const idx = memoryDb.users.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      memoryDb.users.splice(idx, 1);
      memoryDb.save();
    }
    try {
      if (await isPrismaReady() && p() && p().user) {
        await p().user.delete({ where: { id: userId } });
        return true;
      }
    } catch {
      // Fallback
    }
    return idx >= 0;
  },

  // --- PAYMENT METHODS ---
  async listPaymentMethods(activeOnly: boolean = false): Promise<PaymentMethodRecord[]> {
    try {
      if (await isPrismaReady() && p() && p().paymentMethod) {
        const whereClause = activeOnly ? { where: { isActive: true }, orderBy: { order: 'asc' } } : { orderBy: { order: 'asc' } };
        const methods = await p().paymentMethod.findMany(whereClause);
        if (methods && methods.length > 0) {
          return methods.map((m: any) => ({
            id: m.id,
            name: m.name,
            amharicName: m.amharicName || m.name,
            account: m.account,
            holder: m.holder,
            color: m.color || 'bg-emerald-600',
            badge: m.badge || 'Active',
            instruction: m.instruction || '',
            isActive: Boolean(m.isActive),
            order: m.order || 0,
            createdAt: m.createdAt?.toISOString?.() || new Date().toISOString(),
            updatedAt: m.updatedAt?.toISOString?.() || new Date().toISOString(),
          }));
        }
      }
    } catch {
      // Fallback to memory
    }

    let list = [...memoryDb.paymentMethods];
    if (activeOnly) {
      list = list.filter((m) => m.isActive);
    }
    return list.sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  async getPaymentMethodById(id: number): Promise<PaymentMethodRecord | null> {
    try {
      if (await isPrismaReady() && p() && p().paymentMethod) {
        const m = await p().paymentMethod.findUnique({ where: { id } });
        if (m) {
          return {
            id: m.id,
            name: m.name,
            amharicName: m.amharicName || m.name,
            account: m.account,
            holder: m.holder,
            color: m.color || 'bg-emerald-600',
            badge: m.badge || 'Active',
            instruction: m.instruction || '',
            isActive: Boolean(m.isActive),
            order: m.order || 0,
            createdAt: m.createdAt?.toISOString?.() || new Date().toISOString(),
            updatedAt: m.updatedAt?.toISOString?.() || new Date().toISOString(),
          };
        }
      }
    } catch {
      // Fallback
    }
    const found = memoryDb.paymentMethods.find((m) => m.id === id);
    return found ? { ...found } : null;
  },

  async createPaymentMethod(data: {
    name: string;
    amharicName?: string;
    account: string;
    holder: string;
    color?: string;
    badge?: string;
    instruction?: string;
    isActive?: boolean;
    order?: number;
  }): Promise<PaymentMethodRecord> {
    const newId = memoryDb.nextPaymentMethodId++;
    const now = new Date().toISOString();
    const newMethod: PaymentMethodRecord = {
      id: newId,
      name: data.name.trim(),
      amharicName: data.amharicName?.trim() || data.name.trim(),
      account: data.account.trim(),
      holder: data.holder.trim(),
      color: data.color || 'bg-emerald-600',
      badge: data.badge || 'Active',
      instruction: data.instruction || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
      order: data.order !== undefined ? data.order : memoryDb.paymentMethods.length + 1,
      createdAt: now,
      updatedAt: now,
    };
    memoryDb.paymentMethods.push(newMethod);
    memoryDb.save();

    try {
      if (await isPrismaReady() && p() && p().paymentMethod) {
        const created = await p().paymentMethod.create({
          data: {
            name: newMethod.name,
            amharicName: newMethod.amharicName,
            account: newMethod.account,
            holder: newMethod.holder,
            color: newMethod.color,
            badge: newMethod.badge,
            instruction: newMethod.instruction,
            isActive: newMethod.isActive,
            order: newMethod.order,
          },
        });
        return {
          id: created.id,
          name: created.name,
          amharicName: created.amharicName,
          account: created.account,
          holder: created.holder,
          color: created.color,
          badge: created.badge,
          instruction: created.instruction,
          isActive: created.isActive,
          order: created.order,
          createdAt: created.createdAt?.toISOString?.() || now,
          updatedAt: created.updatedAt?.toISOString?.() || now,
        };
      }
    } catch {
      // Fallback
    }

    return newMethod;
  },

  async updatePaymentMethod(
    id: number,
    data: Partial<PaymentMethodRecord>
  ): Promise<PaymentMethodRecord | null> {
    const mem = memoryDb.paymentMethods.find((m) => m.id === id);
    const now = new Date().toISOString();
    if (mem) {
      if (data.name !== undefined) mem.name = data.name.trim();
      if (data.amharicName !== undefined) mem.amharicName = data.amharicName.trim();
      if (data.account !== undefined) mem.account = data.account.trim();
      if (data.holder !== undefined) mem.holder = data.holder.trim();
      if (data.color !== undefined) mem.color = data.color;
      if (data.badge !== undefined) mem.badge = data.badge;
      if (data.instruction !== undefined) mem.instruction = data.instruction;
      if (data.isActive !== undefined) mem.isActive = Boolean(data.isActive);
      if (data.order !== undefined) mem.order = Number(data.order);
      mem.updatedAt = now;
      memoryDb.save();
    }

    try {
      if (await isPrismaReady() && p() && p().paymentMethod) {
        const updated = await p().paymentMethod.update({
          where: { id },
          data: {
            ...(data.name !== undefined && { name: data.name.trim() }),
            ...(data.amharicName !== undefined && { amharicName: data.amharicName.trim() }),
            ...(data.account !== undefined && { account: data.account.trim() }),
            ...(data.holder !== undefined && { holder: data.holder.trim() }),
            ...(data.color !== undefined && { color: data.color }),
            ...(data.badge !== undefined && { badge: data.badge }),
            ...(data.instruction !== undefined && { instruction: data.instruction }),
            ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
            ...(data.order !== undefined && { order: Number(data.order) }),
          },
        });
        return {
          id: updated.id,
          name: updated.name,
          amharicName: updated.amharicName,
          account: updated.account,
          holder: updated.holder,
          color: updated.color,
          badge: updated.badge,
          instruction: updated.instruction,
          isActive: updated.isActive,
          order: updated.order,
          createdAt: updated.createdAt?.toISOString?.() || now,
          updatedAt: updated.updatedAt?.toISOString?.() || now,
        };
      }
    } catch {
      // Fallback
    }

    return mem ? { ...mem } : null;
  },

  async deletePaymentMethod(id: number): Promise<boolean> {
    const idx = memoryDb.paymentMethods.findIndex((m) => m.id === id);
    if (idx >= 0) {
      memoryDb.paymentMethods.splice(idx, 1);
      memoryDb.save();
    }
    try {
      if (await isPrismaReady() && p() && p().paymentMethod) {
        await p().paymentMethod.delete({ where: { id } });
        return true;
      }
    } catch {
      // Fallback
    }
    return idx >= 0;
  },

  async getBlogPosts(options?: {
    status?: 'published' | 'draft' | 'all';
    category?: string;
    search?: string;
  }): Promise<BlogPostRecord[]> {
    syncDb();
    let list = [...(memoryDb.blogPosts || [])];

    if (options?.status && options.status !== 'all') {
      list = list.filter((b) => b.status === options.status);
    }
    if (options?.category && options.category !== 'All') {
      list = list.filter(
        (b) => b.category.toLowerCase() === options.category!.toLowerCase()
      );
    }
    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.excerpt.toLowerCase().includes(q) ||
          b.content.toLowerCase().includes(q) ||
          b.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return list.sort(
      (a, b) =>
        new Date(b.publishedAt || b.createdAt).getTime() -
        new Date(a.publishedAt || a.createdAt).getTime()
    );
  },

  async getBlogPostBySlug(slug: string): Promise<BlogPostRecord | null> {
    syncDb();
    const post = (memoryDb.blogPosts || []).find(
      (blogPost) => blogPost.slug === slug && blogPost.status === 'published'
    );
    if (post) {
      post.views = (post.views || 0) + 1;
      memoryDb.save();
      return { ...post };
    }
    return null;
  },

  async getBlogPostById(id: number): Promise<BlogPostRecord | null> {
    syncDb();
    const post = (memoryDb.blogPosts || []).find((b) => b.id === id);
    return post ? { ...post } : null;
  },

  async createBlogPost(data: {
    title: string;
    slug?: string;
    excerpt: string;
    content: string;
    coverImage?: string;
    category?: string;
    tags?: string[];
    authorName?: string;
    authorAvatar?: string;
    status?: 'published' | 'draft';
  }): Promise<BlogPostRecord> {
    syncDb();
    const now = new Date().toISOString();
    let baseSlug = (data.slug || data.title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (!baseSlug) baseSlug = `post-${Date.now()}`;

    let finalSlug = baseSlug;
    let counter = 1;
    while ((memoryDb.blogPosts || []).some((b) => b.slug === finalSlug)) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const wordCount = data.content ? data.content.split(/\s+/).length : 0;
    const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

    const newPost: BlogPostRecord = {
      id: memoryDb.nextBlogPostId++,
      title: data.title.trim(),
      slug: finalSlug,
      excerpt: data.excerpt.trim(),
      content: data.content,
      coverImage: data.coverImage || '/podcast-preview.jpg',
      category: data.category || 'Tips & Tricks',
      tags: Array.isArray(data.tags) ? data.tags : ['Amharic', 'Captions', 'AI'],
      authorName: data.authorName || 'Bgern Editorial',
      authorAvatar: data.authorAvatar || '/logo.png',
      readTimeMinutes,
      views: 1,
      status: data.status || 'published',
      publishedAt: data.status === 'published' ? now : undefined,
      createdAt: now,
      updatedAt: now,
    };

    if (!memoryDb.blogPosts) memoryDb.blogPosts = [];
    memoryDb.blogPosts.unshift(newPost);
    memoryDb.save();
    return newPost;
  },

  async updateBlogPost(
    id: number,
    data: Partial<BlogPostRecord>
  ): Promise<BlogPostRecord | null> {
    syncDb();
    if (!memoryDb.blogPosts) memoryDb.blogPosts = [];
    const post = memoryDb.blogPosts.find((b) => b.id === id);
    if (!post) return null;

    const now = new Date().toISOString();
    if (data.title !== undefined) post.title = data.title.trim();
    if (data.slug !== undefined && data.slug.trim()) {
      post.slug = data.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    if (data.excerpt !== undefined) post.excerpt = data.excerpt.trim();
    if (data.content !== undefined) {
      post.content = data.content;
      const wordCount = data.content.split(/\s+/).length;
      post.readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
    }
    if (data.coverImage !== undefined) post.coverImage = data.coverImage;
    if (data.category !== undefined) post.category = data.category;
    if (data.tags !== undefined) post.tags = data.tags;
    if (data.authorName !== undefined) post.authorName = data.authorName;
    if (data.authorAvatar !== undefined) post.authorAvatar = data.authorAvatar;
    if (data.status !== undefined) {
      post.status = data.status;
      if (data.status === 'published' && !post.publishedAt) {
        post.publishedAt = now;
      }
    }
    post.updatedAt = now;

    memoryDb.save();
    return { ...post };
  },

  async deleteBlogPost(id: number): Promise<boolean> {
    syncDb();
    if (!memoryDb.blogPosts) return false;
    const idx = memoryDb.blogPosts.findIndex((b) => b.id === id);
    if (idx >= 0) {
      memoryDb.blogPosts.splice(idx, 1);
      memoryDb.save();
      return true;
    }
    return false;
  },

  // --- NOTIFICATIONS ---
  async createNotification(data: {
    userId?: number;
    targetRole?: 'USER' | 'ADMIN' | 'ALL';
    type: 'PAYMENT_PENDING' | 'PAYMENT_APPROVED' | 'PAYMENT_REJECTED' | 'VIDEO_PENDING' | 'CREDIT_UPDATE' | 'SYSTEM';
    title: string;
    message: string;
    data?: any;
  }): Promise<NotificationRecord> {
    syncDb();
    if (!memoryDb.notifications) memoryDb.notifications = [];
    const newNotif: NotificationRecord = {
      id: memoryDb.nextNotificationId++,
      userId: data.userId,
      targetRole: data.targetRole || (data.userId ? 'USER' : 'ADMIN'),
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || {},
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    memoryDb.notifications.unshift(newNotif);
    memoryDb.save();
    return { ...newNotif };
  },

  async listNotifications(filter?: {
    userId?: number;
    targetRole?: 'USER' | 'ADMIN' | 'ALL';
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<NotificationRecord[]> {
    syncDb();
    let notifs = memoryDb.notifications || [];
    if (filter?.userId !== undefined) {
      if (filter.targetRole === 'ADMIN') {
        notifs = notifs.filter((n) => n.targetRole === 'ADMIN' || (n.userId === filter.userId && n.targetRole !== 'USER'));
      } else {
        notifs = notifs.filter(
          (n) =>
            n.targetRole !== 'ADMIN' &&
            (n.userId === filter.userId ||
              ((n.userId === undefined || n.userId === null) &&
                (n.targetRole === 'ALL' || n.targetRole === 'USER')))
        );
      }
    } else if (filter?.targetRole) {
      if (filter.targetRole === 'USER') {
        notifs = notifs.filter((n) => n.targetRole !== 'ADMIN' && (n.targetRole === 'USER' || n.targetRole === 'ALL'));
      } else {
        notifs = notifs.filter((n) => n.targetRole === filter.targetRole || n.targetRole === 'ALL');
      }
    }
    if (filter?.unreadOnly) {
      notifs = notifs.filter((n) => !n.isRead);
    }
    const limit = filter?.limit || 50;
    return notifs.slice(0, limit).map((n) => ({ ...n }));
  },

  async markNotificationAsRead(id: number, userId?: number): Promise<boolean> {
    syncDb();
    if (!memoryDb.notifications) return false;
    const notif = memoryDb.notifications.find((n) => n.id === id);
    if (!notif) return false;
    if (userId && notif.userId && notif.userId !== userId && notif.targetRole !== 'ADMIN') {
      return false;
    }
    notif.isRead = true;
    memoryDb.save();
    return true;
  },

  async markAllNotificationsAsRead(filter?: {
    userId?: number;
    targetRole?: 'USER' | 'ADMIN' | 'ALL';
  }): Promise<number> {
    syncDb();
    if (!memoryDb.notifications) return 0;
    let count = 0;
    for (const notif of memoryDb.notifications) {
      if (notif.isRead) continue;
      let matches = false;
      if (filter?.userId !== undefined) {
        if (filter.targetRole === 'ADMIN') {
          matches = notif.targetRole === 'ADMIN' || notif.userId === filter.userId;
        } else {
          matches = notif.targetRole !== 'ADMIN' && (notif.userId === filter.userId || notif.targetRole === 'ALL' || notif.targetRole === 'USER');
        }
      } else if (filter?.targetRole) {
        if (filter.targetRole === 'USER') {
          matches = notif.targetRole !== 'ADMIN' && (notif.targetRole === 'USER' || notif.targetRole === 'ALL');
        } else {
          matches = notif.targetRole === filter.targetRole || notif.targetRole === 'ALL';
        }
      } else {
        matches = true;
      }
      if (matches) {
        notif.isRead = true;
        count++;
      }
    }
    if (count > 0) {
      memoryDb.save();
    }
    return count;
  },

  async getUnreadNotificationsCount(filter?: {
    userId?: number;
    targetRole?: 'USER' | 'ADMIN' | 'ALL';
  }): Promise<number> {
    syncDb();
    const notifs = await this.listNotifications({ ...filter, unreadOnly: true });
    return notifs.length;
  },

  // --- PASSWORD RESET SYSTEM ---
  async createPasswordReset(
    email: string,
    token: string,
    code: string,
    expiresInMs = 3600000
  ): Promise<PasswordResetRecord> {
    syncDb();
    const normalized = email.toLowerCase().trim();
    const expiresAt = Date.now() + expiresInMs;
    // Clear old/expired resets for this email
    memoryDb.passwordResets = (memoryDb.passwordResets || []).filter(
      (r) => r.email.toLowerCase() !== normalized && r.expiresAt > Date.now()
    );
    const record: PasswordResetRecord = { email: normalized, token, code, expiresAt };
    memoryDb.passwordResets.push(record);
    memoryDb.save();
    return record;
  },

  async findPasswordReset(tokenOrCode: string): Promise<PasswordResetRecord | null> {
    syncDb();
    const clean = String(tokenOrCode).trim();
    const now = Date.now();
    const found = (memoryDb.passwordResets || []).find(
      (r) => (r.token === clean || r.code === clean) && r.expiresAt > now
    );
    return found ? { ...found } : null;
  },

  async completePasswordReset(tokenOrCode: string, hashedPassword: string): Promise<UserRecord | null> {
    syncDb();
    const clean = String(tokenOrCode).trim();
    const resetIndex = (memoryDb.passwordResets || []).findIndex(
      (record) =>
        (record.token === clean || record.code === clean) &&
        record.expiresAt > Date.now()
    );
    if (resetIndex < 0) return null;
    const [reset] = memoryDb.passwordResets.splice(resetIndex, 1);
    memoryDb.save();

    const user = await this.findUserByEmail(reset.email);
    if (!user) return null;

    const updated = await this.updateUser(user.id, { password: hashedPassword });
    if (!updated) {
      memoryDb.passwordResets.push(reset);
      memoryDb.save();
      return null;
    }

    memoryDb.passwordResets = (memoryDb.passwordResets || []).filter(
      (r) => r.email.toLowerCase() !== reset.email.toLowerCase()
    );
    memoryDb.save();

    return updated;
  },
};
