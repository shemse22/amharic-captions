import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diag: Record<string, any> = {
    time: new Date().toISOString(),
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
    platform: process.platform,
    nodeVersion: process.version,
    files: {},
    modules: {},
  };

  // Test critical file paths
  const testPaths = [
    path.join(process.cwd(), 'data', 'local_db.json'),
    path.join(__dirname, 'data', 'local_db.json'),
    '/home/bgerncxv/bgern/data/local_db.json',
    '/usr/sbin/sendmail',
  ];

  for (const p of testPaths) {
    try {
      diag.files[p] = fs.existsSync(p);
    } catch (e: any) {
      diag.files[p] = `Error: ${e.message}`;
    }
  }

  // Test critical module imports (use string concat to prevent webpack bundling)
  const testModules = ['jsonwebtoken', 'bcryptjs', 'nodemailer', '@prisma/client'];
  for (const m of testModules) {
    try {
      const mod = m.split('/').join('/'); // prevent webpack static resolution
      require(mod);
      diag.modules[m] = 'OK';
    } catch (e: any) {
      diag.modules[m] = `FAILED: ${e.message}`;
    }
  }

  // Test dbService
  try {
    const { dbService } = require('@/lib/db');
    const users = await dbService.listUsers();
    diag.dbUsersCount = users ? users.length : 0;
    const admin = await dbService.findUserByEmail('thebigel16@gmail.com');
    diag.adminFound = Boolean(admin);
    diag.adminHasPassword = Boolean(admin?.password);
  } catch (e: any) {
    diag.dbError = e.stack || e.message;
  }

  return NextResponse.json(diag);
}
