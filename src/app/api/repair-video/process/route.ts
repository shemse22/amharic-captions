import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { repairAndNotifyVideoJob } from '@/services/videoRepairService';
import { getLocalTempFilePath } from '@/lib/temp-dir';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 180;

/**
 * POST /api/repair-video/process
 * Accepts `bgern_alex_hormozi_720p.mp4`, executes FastStart moov repair via FFmpeg,
 * updates rendering job to 'COMPLETED' in the database via Prisma ORM,
 * and emits a download notification to the user's dashboard.
 */
export async function POST(req: NextRequest) {
  let tempIn = '';

  try {
    const formData = await req.formData();
    const file = (formData.get('file') || formData.get('video')) as File | null;
    const userId = parseInt(String(formData.get('userId') || '3'), 10);
    const projectId = parseInt(String(formData.get('projectId') || '1'), 10);
    const filename = String(formData.get('filename') || 'bgern_alex_hormozi_720p.mp4');
    const reencodeCfr = formData.get('reencodeCfr') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    const isInputMp4 = (file.type && file.type.includes('mp4')) || (file.name && file.name.endsWith('.mp4'));
    const inputExt = isInputMp4 ? '.mp4' : '.webm';
    tempIn = getLocalTempFilePath('proc_in', inputExt);

    const arrayBuffer = await file.arrayBuffer();
    await fs.promises.writeFile(tempIn, Buffer.from(arrayBuffer), { mode: 0o666 });

    const result = await repairAndNotifyVideoJob({
      userId,
      projectId,
      inputFilePath: tempIn,
      filename,
      reencodeCfr,
    });

    // Cleanup input
    fs.promises.unlink(tempIn).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Video repaired, status updated to COMPLETED, and notification emitted!',
      downloadUrl: result.downloadUrl,
      filename: result.filename,
    });
  } catch (error: any) {
    fs.promises.unlink(tempIn).catch(() => {});
    return NextResponse.json(
      { error: error?.message || 'Processing and notification trigger failed' },
      { status: 500 }
    );
  }
}
