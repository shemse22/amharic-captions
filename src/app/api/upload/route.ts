import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { isSupportedReceiptFile, isSupportedReceiptImage } from '@/lib/payment-receipt';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Auto-cleanup helper to remove video/audio files older than 7 days
async function pruneOldUploads(uploadsDir: string) {
  try {
    if (!fs.existsSync(uploadsDir)) return;
    const now = Date.now();
    const files = await fs.promises.readdir(uploadsDir);
    for (const fileName of files) {
      try {
        const filePath = path.join(uploadsDir, fileName);
        const stats = await fs.promises.stat(filePath);
        if (now - stats.mtimeMs > SEVEN_DAYS_MS) {
          await fs.promises.unlink(filePath);
          console.log(`[7-Day Auto-Cleanup] Removed expired upload: ${fileName}`);
        }
      } catch {}
    }
  } catch (e) {
    console.error('[7-Day Auto-Cleanup] Error cleaning uploads:', e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Sign in before uploading files.' },
        { status: 401 }
      );
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Run 7-day cleanup in background
    pruneOldUploads(uploadsDir).catch(() => {});

    const formData = await req.formData();
    const fileEntry = formData.get('file');

    if (!fileEntry || typeof fileEntry === 'string') {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }
    const file = fileEntry;
    const isReceipt = formData.get('purpose') === 'payment-receipt';

    if (isReceipt && !isSupportedReceiptFile(file)) {
      return NextResponse.json(
        { success: false, error: 'Receipt must be a JPEG, PNG, or WebP image no larger than 10 MB.' },
        { status: 400 }
      );
    }

    // Other upload uses support videos and media up to 250MB.
    if (!isReceipt && file.size > 250 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File exceeds maximum size of 250MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (isReceipt) {
      if (!isSupportedReceiptImage(file, buffer)) {
        return NextResponse.json({ success: false, error: 'The uploaded file is not a valid image.' }, { status: 400 });
      }
    }

    // Sanitize filename and prepend timestamp
    const receiptExtensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    const ext = isReceipt ? receiptExtensions[file.type] : path.extname(file.name) || '.mp4';
    const baseName = isReceipt
      ? 'payment_receipt'
      : path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    const uniqueFileName = `${Date.now()}_${baseName}${ext}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueFileName}`;
    const now = Date.now();

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uniqueFileName,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + SEVEN_DAYS_MS).toISOString(),
    });
  } catch (error: unknown) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'File upload failed' },
      { status: 500 }
    );
  }
}
