import path from 'path';
import fs from 'fs';

/**
 * Returns a reliable local temporary directory within the application directory.
 * On cPanel / CloudLinux shared hosting, `/tmp` (os.tmpdir()) has CageFS/SELinux restrictions
 * causing "Operation not permitted" when child processes (like FFmpeg) try to read/write.
 * Using an in-app path inside `public/uploads/.temp` guarantees identical user permissions.
 */
export function getLocalTempDir(): string {
  const tempDir = path.join(process.cwd(), 'public', 'uploads', '.temp');
  if (!fs.existsSync(tempDir)) {
    try {
      fs.mkdirSync(tempDir, { recursive: true, mode: 0o777 });
    } catch {}
  }
  return tempDir;
}

/**
 * Creates a unique temp file path in the application temp folder with appropriate permissions.
 */
export function getLocalTempFilePath(prefix: string, extension: string): string {
  const dir = getLocalTempDir();
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  const random = Math.random().toString(36).substring(2, 9);
  return path.join(dir, `${prefix}_${Date.now()}_${random}${ext}`);
}
