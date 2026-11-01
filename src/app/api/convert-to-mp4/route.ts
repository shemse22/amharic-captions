import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { validateMp4 } from '@/lib/validate-mp4';
import { getLocalTempFilePath } from '@/lib/temp-dir';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

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

function getFfmpegBinaryPath(): string {
  if (ffmpegInstaller && ffmpegInstaller.path && fs.existsSync(ffmpegInstaller.path)) {
    return ffmpegInstaller.path;
  }
  const binary = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const platformArch = `${process.platform}-${process.arch}`;

  // 1. Direct path in node_modules/@ffmpeg-installer/<platform-arch>/
  const directPath = path.join(process.cwd(), 'node_modules', '@ffmpeg-installer', platformArch, binary);
  if (fs.existsSync(directPath)) {
    return directPath;
  }

  // 2. Windows fallback
  if (process.platform === 'win32') {
    const winPath = path.join(process.cwd(), 'node_modules', '@ffmpeg-installer', 'win32-x64', 'ffmpeg.exe');
    if (fs.existsSync(winPath)) {
      return winPath;
    }
  }

  // 3. System PATH fallback
  return binary;
}

export async function POST(req: NextRequest) {
  let tempInputPath = '';
  let mp4FilePath = '';
  let keepOutput = false;

  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Run 7-day cleanup in background
    pruneOldUploads(uploadsDir).catch(() => {});

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const requestedName = (formData.get('filename') as string | null) || 'exported_video.mp4';
    const resolutionParam = (formData.get('resolution') as string | null) || (requestedName.includes('1080p') ? '1080p' : '720p');
    const fpsParam = parseInt((formData.get('fps') as string | null) || (requestedName.includes('60p') ? '60' : '30'), 10) || 30;
    const widthValue = formData.get('width');
    const heightValue = formData.get('height');
    const requestedWidth = widthValue === null ? null : Number(widthValue);
    const requestedHeight = heightValue === null ? null : Number(heightValue);
    const durationValue = formData.get('duration');
    const outputDuration = durationValue === null ? null : Number(durationValue);
    if (outputDuration !== null && (!Number.isFinite(outputDuration) || outputDuration <= 0 || outputDuration > 21600)) {
      throw new Error('The requested export duration is invalid.');
    }
    let scaleFilter = 'scale=trunc(iw/2)*2:trunc(ih/2)*2';
    if (requestedWidth !== null || requestedHeight !== null) {
      if (
        requestedWidth === null ||
        requestedHeight === null ||
        !Number.isInteger(requestedWidth) ||
        !Number.isInteger(requestedHeight) ||
        requestedWidth < 2 ||
        requestedHeight < 2 ||
        requestedWidth > 1920 ||
        requestedHeight > 1920 ||
        requestedWidth % 2 !== 0 ||
        requestedHeight % 2 !== 0
      ) {
        throw new Error('The requested export dimensions are invalid.');
      }
      scaleFilter = `scale=${requestedWidth}:${requestedHeight}:flags=fast_bilinear`;
    }

    if (!file) {
      return NextResponse.json({ success: false, error: 'No video file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save uploaded recorded file to local temp directory (avoiding /tmp restrictions on cPanel CageFS)
    const isInputMp4 = (file.type && file.type.includes('mp4')) || (file.name && file.name.endsWith('.mp4'));
    const inputExt = isInputMp4 ? '.mp4' : '.webm';
    tempInputPath = getLocalTempFilePath('bgern_in', inputExt);
    await fs.promises.writeFile(tempInputPath, buffer, { mode: 0o666 });

    // Prepare destination MP4 in public/uploads
    const cleanBaseName = path
      .basename(requestedName, path.extname(requestedName))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50);
    const mp4FileName = `${Date.now()}_${cleanBaseName}.mp4`;
    mp4FilePath = path.join(uploadsDir, mp4FileName);

    const ffmpegPath = getFfmpegBinaryPath();

    console.log(
      `[convert-to-mp4] Encoding H.264 ultrafast, resolution: ${resolutionParam}, fps: ${fpsParam}, ` +
      `dimensions: ${requestedWidth ?? 'auto'}x${requestedHeight ?? 'auto'}`
    );

    // Rebuild timestamps and encode at a true constant frame rate for local-player compatibility.
    // NOTE: Keep args compatible with old FFmpeg N-47601 (2018/4.x era) on cPanel.
    // Avoid: -vsync cfr (broken on old builds), setpts filter, -profile:v high -level (conflicts with old encoder),
    //        -video_track_timescale, -af aresample, -threads:v
    await new Promise<void>((resolve, reject) => {
      let isDone = false;
      const args = [
        '-y',
        '-nostdin',
        '-fflags',
        '+genpts+igndts',
        '-i',
        tempInputPath,
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        '-crf',
        '23',
        '-pix_fmt',
        'yuv420p',
        '-vf',
        `${scaleFilter},setsar=1`,
        '-g',
        '30',
        '-bf',
        '0',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-ar',
        '44100',
        '-ac',
        '2',
        '-movflags',
        '+faststart',
      ];
      if (outputDuration !== null) {
        args.push('-t', outputDuration.toFixed(3));
      }
      args.push(mp4FilePath);

      const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'] });
      let stderrData = '';

      const timeout = setTimeout(() => {
        if (isDone) return;
        isDone = true;
        try {
          proc.kill('SIGKILL');
        } catch {}
        reject(new Error('FFmpeg conversion process timed out after 120 seconds'));
      }, 120000);

      proc.stderr.on('data', (d) => {
        stderrData += d.toString();
      });

      proc.on('error', (err) => {
        if (isDone) return;
        isDone = true;
        clearTimeout(timeout);
        reject(new Error(`Failed to spawn FFmpeg: ${err.message}`));
      });

      proc.on('close', (code) => {
        if (isDone) return;
        isDone = true;
        clearTimeout(timeout);
        if (code === 0) {
          resolve();
        } else {
          console.error('[convert-to-mp4] FFmpeg failed with code:', code, stderrData);
          reject(new Error(`FFmpeg exited with code ${code}: ${stderrData.slice(-2000)}`));
        }
      });
    });

    // Check that converted MP4 exists and has size
    const stat = await fs.promises.stat(mp4FilePath);
    if (!stat || stat.size === 0) {
      throw new Error('Converted MP4 file is empty or missing');
    }

    await validateMp4(ffmpegPath, mp4FilePath);

    const publicUrl = `/api/exports/${encodeURIComponent(mp4FileName)}`;
    keepOutput = true;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: mp4FileName,
      size: stat.size,
      mimeType: 'video/mp4',
      h264: {
        profile: 'auto',
        level: 'auto',
        fps: fpsParam,
      },
    });
  } catch (error: unknown) {
    console.error('[convert-to-mp4] Conversion error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Video conversion to MP4 failed' },
      { status: 500 }
    );
  } finally {
    // Clean up temporary input file
    if (tempInputPath && fs.existsSync(tempInputPath)) {
      try {
        await fs.promises.unlink(tempInputPath);
      } catch {}
    }
    if (mp4FilePath && !keepOutput && fs.existsSync(mp4FilePath)) {
      try {
        await fs.promises.unlink(mp4FilePath);
      } catch {}
    }
  }
}
