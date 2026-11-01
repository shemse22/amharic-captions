import { spawn } from 'child_process';

export interface FfprobeStream {
  codec_type?: string;
  codec_name?: string;
  pix_fmt?: string;
  width?: number;
  height?: number;
  r_frame_rate?: string;
  avg_frame_rate?: string;
  duration?: string;
}

export interface FfprobeResult {
  streams?: FfprobeStream[];
  format?: {
    duration?: string;
    size?: string;
  };
}

export interface FreezeEvent {
  start: number;
  duration: number;
  end: number;
}

export interface ExportValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  videoCodec?: string;
  pixFmt?: string;
  isCfr?: boolean;
  audioCodec?: string;
  videoDuration?: number;
  audioDuration?: number;
  freezes?: FreezeEvent[];
}

function parseFraction(str?: string): number {
  if (!str) return 0;
  const parts = str.split('/');
  if (parts.length === 2) {
    const num = parseFloat(parts[0]);
    const den = parseFloat(parts[1]);
    return den !== 0 ? num / den : 0;
  }
  return parseFloat(str) || 0;
}

/**
 * Runs ffprobe to inspect stream metadata in JSON format.
 */
export async function probeMedia(ffprobePath: string, filePath: string): Promise<FfprobeResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      ffprobePath,
      [
        '-v', 'error',
        '-show_streams',
        '-show_format',
        '-of', 'json',
        filePath,
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] }
    );

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => {
      stdout += d.toString();
    });

    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    proc.on('error', reject);

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`ffprobe failed (${code}): ${stderr || 'Unknown error'}`));
      }
      try {
        const parsed = JSON.parse(stdout) as FfprobeResult;
        resolve(parsed);
      } catch (e: any) {
        reject(new Error(`Could not parse ffprobe JSON output: ${e.message}`));
      }
    });
  });
}

/**
 * Runs ffmpeg freezedetect filter to discover frozen video sections >= 1s.
 */
export async function detectFreezes(ffmpegPath: string, filePath: string): Promise<FreezeEvent[]> {
  return new Promise((resolve) => {
    const proc = spawn(
      ffmpegPath,
      [
        '-nostdin',
        '-hide_banner',
        '-threads', '2',
        '-i', filePath,
        '-threads', '2',
        '-vf', 'freezedetect=n=0.003:d=1',
        '-map', '0:v:0',
        '-f', 'null',
        '-',
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] }
    );

    let stderr = '';

    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    proc.on('error', () => resolve([]));

    proc.on('close', () => {
      const freezes: FreezeEvent[] = [];
      const lines = stderr.split('\n');
      let currentStart: number | null = null;
      let currentDuration: number | null = null;

      for (const line of lines) {
        const startMatch = line.match(/freeze_start:\s*([0-9.]+)/);
        if (startMatch) {
          currentStart = parseFloat(startMatch[1]);
        }
        const durMatch = line.match(/freeze_duration:\s*([0-9.]+)/);
        if (durMatch) {
          currentDuration = parseFloat(durMatch[1]);
        }
        const endMatch = line.match(/freeze_end:\s*([0-9.]+)/);
        if (endMatch && currentStart !== null) {
          const end = parseFloat(endMatch[1]);
          const duration = currentDuration !== null ? currentDuration : (end - currentStart);
          if (duration >= 1.0) {
            freezes.push({ start: currentStart, duration, end });
          }
          currentStart = null;
          currentDuration = null;
        }
      }
      resolve(freezes);
    });
  });
}

/**
 * Validates the exported MP4 video per strict export requirements:
 * - h264 video, yuv420p pixel format
 * - Constant frame rate (r_frame_rate == avg_frame_rate)
 * - aac audio (if audio exists in output)
 * - Duration difference between audio and video < 0.1 s
 * - No new freeze >= 1s introduced by export that wasn't in source
 */
export async function validateExportedVideo(
  ffmpegPath: string,
  ffprobePath: string,
  exportFilePath: string,
  sourceFilePath?: string
): Promise<ExportValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const probe = await probeMedia(ffprobePath, exportFilePath);
  const videoStream = (probe.streams || []).find((s) => s.codec_type === 'video');
  const audioStream = (probe.streams || []).find((s) => s.codec_type === 'audio');

  if (!videoStream) {
    errors.push('Output file does not contain a video stream.');
    return { valid: false, errors, warnings };
  }

  // 1. Check video codec: must be h264
  const videoCodec = videoStream.codec_name?.toLowerCase();
  if (videoCodec !== 'h264') {
    errors.push(`Video codec is "${videoCodec}", expected "h264".`);
  }

  // 2. Check pixel format: must be yuv420p
  const pixFmt = videoStream.pix_fmt?.toLowerCase();
  if (pixFmt !== 'yuv420p') {
    errors.push(`Video pixel format is "${pixFmt}", expected "yuv420p".`);
  }

  // 3. Check constant frame rate: r_frame_rate == avg_frame_rate
  const rFps = parseFraction(videoStream.r_frame_rate);
  const avgFps = parseFraction(videoStream.avg_frame_rate);
  const isCfr = Math.abs(rFps - avgFps) < 0.05 && rFps > 0;
  if (!isCfr) {
    errors.push(`Video frame rate is variable (r_frame_rate: ${videoStream.r_frame_rate}, avg: ${videoStream.avg_frame_rate}), expected constant frame rate.`);
  }

  // 4. Check audio stream if present
  let audioCodec: string | undefined;
  let videoDur = parseFloat(videoStream.duration || probe.format?.duration || '0');
  let audioDur: number | undefined;

  if (audioStream) {
    audioCodec = audioStream.codec_name?.toLowerCase();
    if (audioCodec !== 'aac') {
      errors.push(`Audio codec is "${audioCodec}", expected "aac".`);
    }
    audioDur = parseFloat(audioStream.duration || probe.format?.duration || '0');
    if (videoDur > 0 && audioDur > 0) {
      const diff = Math.abs(videoDur - audioDur);
      if (diff >= 0.1) {
        errors.push(`Duration difference between audio (${audioDur.toFixed(3)}s) and video (${videoDur.toFixed(3)}s) is ${diff.toFixed(3)}s, exceeds 0.1s tolerance.`);
      }
    }
  }

  // 5. Run freezedetect=n=0.003:d=1
  const outputFreezes = await detectFreezes(ffmpegPath, exportFilePath);

  if (outputFreezes.length > 0) {
    let sourceFreezes: FreezeEvent[] = [];
    if (sourceFilePath) {
      try {
        sourceFreezes = await detectFreezes(ffmpegPath, sourceFilePath);
      } catch {}
    }

    // Check if output freezes were already in the source
    for (const outF of outputFreezes) {
      const inSource = sourceFreezes.some(
        (srcF) => Math.abs(srcF.start - outF.start) < 0.5 && Math.abs(srcF.duration - outF.duration) < 0.8
      );
      if (!inSource) {
        errors.push(
          `Detected video freeze of ${outF.duration.toFixed(2)}s starting at ${outF.start.toFixed(2)}s that was not present in source video.`
        );
      } else {
        warnings.push(
          `Video freeze of ${outF.duration.toFixed(2)}s at ${outF.start.toFixed(2)}s is present in source video.`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    videoCodec,
    pixFmt,
    isCfr,
    audioCodec,
    videoDuration: videoDur,
    audioDuration: audioDur,
    freezes: outputFreezes,
  };
}
