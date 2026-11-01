import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { dbService } from '@/lib/db';

// Configure FFmpeg binary path
if (ffmpegInstaller && ffmpegInstaller.path) {
  ffmpeg.setFfmpegPath(ffmpegInstaller.path);
}

export interface VideoRepairJobParams {
  userId: number;
  projectId: number;
  inputFilePath: string;
  filename?: string;
  reencodeCfr?: boolean;
}

export interface VideoRepairJobResult {
  success: boolean;
  downloadUrl: string;
  outputPath: string;
  filename: string;
}

/**
 * Backend Service: Runs FFmpeg repair with FastStart moov relocation on `bgern_alex_hormozi_720p.mp4`,
 * updates the job status to 'COMPLETED' via Prisma ORM in the database,
 * and emits a high-priority dashboard notification to the user.
 */
export async function repairAndNotifyVideoJob(
  params: VideoRepairJobParams
): Promise<VideoRepairJobResult> {
  const {
    userId,
    projectId,
    inputFilePath,
    filename = 'bgern_alex_hormozi_720p.mp4',
    reencodeCfr = false,
  } = params;

  // Prepare destination directory in public/uploads/videos
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const safeUniqueName = `repaired_${Date.now()}_${filename}`;
  const finalOutputPath = path.join(uploadsDir, safeUniqueName);
  const relativeDownloadUrl = `/uploads/videos/${safeUniqueName}`;

  let accumulatedStderr = '';

  try {
    // 1. Run FFmpeg faststart repair / CFR transcode
    await new Promise<void>((resolve, reject) => {
      const command = ffmpeg(inputFilePath);

      // Guaranteed H.264 (AVC) + AAC + yuv420p + CFR + FastStart rendering
      const targetFps = reencodeCfr ? '60' : '30';
      command.outputOptions([
        '-c:v libx264',
        '-preset veryfast',
        '-crf 18',
        '-profile:v high',
        '-level 4.2',
        '-pix_fmt yuv420p',
        '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2',
        `-r ${targetFps}`,
        '-vsync cfr',
        '-c:a aac',
        '-b:a 192k',
        '-ar 44100',
        '-ac 2',
        '-movflags +faststart',
        '-avoid_negative_ts make_zero',
        '-fflags +genpts',
      ]);

      command
        .output(finalOutputPath)
        .on('start', (cmdLine) => {
          console.log(`[VideoRepairService] Running: ${cmdLine}`);
        })
        .on('stderr', (stderrLine) => {
          accumulatedStderr += stderrLine + '\n';
        })
        .on('end', () => {
          console.log(`[VideoRepairService] FFmpeg finished faststart injection for ${filename}`);
          resolve();
        })
        .on('error', (err) => {
          reject(new Error(accumulatedStderr || err?.message || 'FFmpeg repair failed'));
        })
        .run();
    });

    // 2. Update Video Project / Rendering Job Status in Database
    let updatedProject: any = null;
    try {
      updatedProject = await dbService.updateVideoStatus(projectId, 'APPROVED');
      console.log(`[Database] Project #${projectId} updated to 'COMPLETED'`);
    } catch (dbErr) {
      console.warn('[DB Update Warning]: Database update fallback:', dbErr);
    }

    // Also update in-memory / local_db fallback store
    await dbService.updateVideoStatus(projectId, 'APPROVED');

    // 3. Emit Dashboard Notification payload to the user
    await dbService.createNotification({
      userId,
      targetRole: 'USER',
      type: 'SYSTEM',
      title: 'ቪዲዮዎ ዝግጁ ነው (Video Ready for Download) 🎬',
      message: `የ ${filename} ቪዲዮዎ በተሳካ ሁኔታ ተስተካክሎ ለዳውንሎድ ዝግጁ ሆኗል! (Your video moov atom has been relocated for instant desktop playback).`,
      data: {
        projectId,
        filename,
        downloadUrl: relativeDownloadUrl,
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
      },
    });

    console.log(`[Notification Emitted] Dispatched download-ready notification for User ID ${userId}`);

    return {
      success: true,
      downloadUrl: relativeDownloadUrl,
      outputPath: finalOutputPath,
      filename,
    };
  } catch (error: any) {
    // On failure: update database status to FAILED / REJECTED and log stderr
    try {
      await dbService.updateVideoStatus(projectId, 'REJECTED', `[Repair Failed]: ${accumulatedStderr.slice(-1000) || error?.message}`);
    } catch {}

    throw error;
  }
}

