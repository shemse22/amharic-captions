import { NextRequest, NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';
import { dbService } from '@/lib/db';
import { getLocalTempFilePath } from '@/lib/temp-dir';

// Ensure FFmpeg binary path is set
if (ffmpegInstaller && ffmpegInstaller.path) {
  ffmpeg.setFfmpegPath(ffmpegInstaller.path);
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 180; // Extended time for full 60 FPS H.264 CFR transcoding

/**
 * POST /api/repair-video/cfr
 * Re-encodes video using libx264 at strict 60 FPS CFR (Constant Frame Rate),
 * moves the moov atom with `-movflags +faststart`, and logs any FFmpeg stderr outputs
 * to Prisma if the encoding process fails.
 */
export async function POST(req: NextRequest) {
  let tempInputPath = '';
  let tempOutputPath = '';
  let projectId: number | null = null;
  let accumulatedStderr = '';

  try {
    const formData = await req.formData();
    const file = (formData.get('file') || formData.get('video')) as File | null;
    const rawProjectId = formData.get('projectId');
    if (rawProjectId) projectId = parseInt(String(rawProjectId), 10);

    if (!file) {
      return NextResponse.json(
        { error: 'No video file provided for CFR re-encoding' },
        { status: 400 }
      );
    }

    const isInputMp4 = (file.type && file.type.includes('mp4')) || (file.name && file.name.endsWith('.mp4'));
    const inputExt = isInputMp4 ? '.mp4' : '.webm';
    tempInputPath = getLocalTempFilePath('cfr_in', inputExt);
    tempOutputPath = getLocalTempFilePath('cfr_out', '.mp4');

    // Write uploaded file to temporary disk buffer
    const arrayBuffer = await file.arrayBuffer();
    await fs.promises.writeFile(tempInputPath, Buffer.from(arrayBuffer), { mode: 0o666 });

    // Run strict CFR transcode with libx264 and FastStart (compatible with FFmpeg N-47601+)
    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempInputPath)
        .inputOptions(['-fflags +genpts+igndts'])
        .outputOptions([
          '-c:v libx264',
          '-preset ultrafast',
          '-crf 20',
          '-r 60',
          '-vsync cfr',
          '-pix_fmt yuv420p',
          '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2,setsar=1',
          '-g 60',
          '-bf 0',
          '-sc_threshold 0',
          '-avoid_negative_ts make_zero',
          '-c:a aac',
          '-b:a 128k',
          '-ar 44100',
          '-ac 2',
          '-movflags +faststart',
        ])
        .output(tempOutputPath)
        .on('start', (cmdLine) => {
          console.log(`[FFmpeg CFR Transcode] Running: ${cmdLine}`);
        })
        .on('stderr', (stderrLine) => {
          accumulatedStderr += stderrLine + '\n';
        })
        .on('end', () => {
          console.log('[FFmpeg CFR Transcode] Successfully encoded video to 60 FPS CFR with FastStart');
          resolve();
        })
        .on('error', (err) => {
          console.error('[FFmpeg CFR Transcode Error]:', err?.message);
          reject(new Error(accumulatedStderr || err?.message || 'CFR Transcoding failed'));
        })
        .run();
    });

    const fileStat = await fs.promises.stat(tempOutputPath);
    const fileBuffer = await fs.promises.readFile(tempOutputPath);

    // Clean up temporary files
    Promise.all([
      fs.promises.unlink(tempInputPath).catch(() => {}),
      fs.promises.unlink(tempOutputPath).catch(() => {}),
    ]);

    const filename = 'bgern_alex_hormozi_720p.mp4';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': fileStat.size.toString(),
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    // Log FFmpeg stderr outputs to DB if encoding process fails
    try {
      if (projectId) {
        await dbService.updateVideoStatus(projectId, 'REJECTED', `[FFmpeg CFR Encoding Failed]: ${accumulatedStderr.slice(-1500) || error?.message}`);
        console.log(`[DB Stderr Logged] Successfully stored FFmpeg stderr for Project #${projectId}`);
      }
    } catch (dbErr) {
      console.warn('[DB Log Stderr Error]: Could not persist error to database:', dbErr);
    }

    // Cleanup temporary files on failure
    await Promise.all([
      fs.promises.unlink(tempInputPath).catch(() => {}),
      fs.promises.unlink(tempOutputPath).catch(() => {}),
    ]);

    return NextResponse.json(
      {
        error: 'Failed to re-encode video with CFR 60 FPS',
        details: error?.message,
        stderr: accumulatedStderr.slice(-1000),
      },
      { status: 500 }
    );
  }
}
