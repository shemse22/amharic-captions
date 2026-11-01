import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import fs from 'node:fs';
import path from 'node:path';
import { getExplicitH264Config } from '@/lib/h264-profile-level';
import { validateMp4 } from '@/lib/validate-mp4';
import { getLocalTempDir, getLocalTempFilePath } from '@/lib/temp-dir';
import { collectVideoDiagnostics } from '@/lib/video-diagnostics';

const FPS = 30;
const MAX_TIMEOUT_MS = 280_000;
const MIN_TIMEOUT_MS = 120_000;

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: Error;
}

interface ExportChecks {
  frameRatesMatch: boolean;
  audioVideoDurationsMatch: boolean | null;
  streamStartsAtZero: boolean;
  keyframeIntervalAtMostTwoSeconds: boolean;
}

function resolveFfmpegPath(): string {
  if (ffmpegInstaller?.path && fs.existsSync(ffmpegInstaller.path)) return ffmpegInstaller.path;
  const binary = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const candidate = path.join(process.cwd(), 'node_modules', '@ffmpeg-installer', `${process.platform}-${process.arch}`, binary);
  return fs.existsSync(candidate) ? candidate : binary;
}

function resolveFfprobePath(ffmpegPath: string): string {
  const configured = process.env.FFPROBE_PATH;
  if (configured && fs.existsSync(configured)) return configured;
  if (ffprobeInstaller?.path && fs.existsSync(ffprobeInstaller.path)) return ffprobeInstaller.path;
  const binary = process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe';
  const sibling = path.join(path.dirname(ffmpegPath), binary);
  return fs.existsSync(sibling) ? sibling : binary;
}

function runCommand(executable: string, args: string[], timeoutMs: number): Promise<CommandResult> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let settled = false;
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(executable, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
      resolve({ stdout, stderr, exitCode: null, error: error instanceof Error ? error : new Error(String(error)) });
      return;
    }

    const finish = (exitCode: number | null, error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve({ stdout, stderr, exitCode, error });
    };
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      finish(null, new Error(`FFmpeg process timed out after ${timeoutMs} ms`));
    }, timeoutMs);

    child.stdout?.on('data', (chunk: Buffer) => {
      if (stdout.length < 1024 * 1024) stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      if (stderr.length < 4 * 1024 * 1024) stderr += chunk.toString();
    });
    child.on('error', (error) => finish(null, error));
    child.on('close', (code) => finish(code));
  });
}

function formatCommand(executable: string, args: string[]): string {
  return [executable, ...args].map((part) => `"${part.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(' ');
}

function rate(value: string | undefined): number | null {
  if (!value || value === 'N/A') return null;
  const [numerator, denominator] = value.split('/').map(Number);
  return Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0
    ? numerator / denominator
    : null;
}

function checkOutput(
  diagnostics: Awaited<ReturnType<typeof collectVideoDiagnostics>>
): { checks: ExportChecks; warnings: string[] } {
  const video = diagnostics.data.output?.streams?.find((stream) => stream.codec_type === 'video');
  const audio = diagnostics.data.output?.streams?.find((stream) => stream.codec_type === 'audio');
  const videoRate = rate(video?.r_frame_rate);
  const averageRate = rate(video?.avg_frame_rate);
  const checks: ExportChecks = {
    frameRatesMatch: videoRate !== null && averageRate !== null && Math.abs(videoRate - averageRate) < 0.001,
    audioVideoDurationsMatch: audio
      ? Number.isFinite(Number(video?.duration)) &&
        Number.isFinite(Number(audio.duration)) &&
        Math.abs(Number(video?.duration) - Number(audio.duration)) < 0.1
      : null,
    streamStartsAtZero: !!video &&
      Number.isFinite(Number(video.start_time)) &&
      Math.abs(Number(video.start_time)) <= 0.1 &&
      (!audio || (Number.isFinite(Number(audio.start_time)) && Math.abs(Number(audio.start_time)) <= 0.1)),
    keyframeIntervalAtMostTwoSeconds:
      diagnostics.data.outputPackets?.maxKeyframeIntervalSeconds !== null &&
      diagnostics.data.outputPackets?.maxKeyframeIntervalSeconds !== undefined &&
      diagnostics.data.outputPackets.maxKeyframeIntervalSeconds <= 2 + 1e-6,
  };
  const warnings: string[] = [];
  if (!checks.frameRatesMatch) warnings.push('The output average and nominal frame rates do not match.');
  if (checks.audioVideoDurationsMatch === false) warnings.push('Audio and video stream durations differ by at least 0.1 seconds.');
  if (!checks.streamStartsAtZero) warnings.push('One or more output streams do not start near zero.');
  if (!checks.keyframeIntervalAtMostTwoSeconds) warnings.push('The output keyframe interval exceeds 2 seconds or could not be measured.');
  return { checks, warnings };
}

function escapeFilterPath(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/,/g, '\\,')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

function makeVideoFilter(subtitlePath: string | null, fontName: string): string {
  const chain = ['scale=trunc(iw/2)*2:trunc(ih/2)*2', `fps=${FPS}`, 'setpts=PTS-STARTPTS'];
  if (subtitlePath) {
    const escapedSubtitle = escapeFilterPath(subtitlePath);
    const escapedFonts = escapeFilterPath(path.join(process.cwd(), 'public', 'fonts'));
    const escapedFontName = fontName.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/:/g, '\\:');
    chain.push(`subtitles=filename='${escapedSubtitle}':fontsdir='${escapedFonts}':force_style='FontName=${escapedFontName}'`);
  }
  return chain.join(',');
}

function tail(stderr: string): string[] {
  const banner = /^(ffmpeg version|built with|configuration:|lib[a-z0-9_]+\s+\d|input #|output #|metadata:|duration:|stream #|encoder\s*:|side data:|press \[q\])/i;
  return stderr.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !banner.test(line)).slice(-15);
}

function doesNotSupportFpsMode(stderr: string): boolean {
  return /(?:unrecognized option|option not found).*fps_mode/i.test(stderr);
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const ffmpegPath = resolveFfmpegPath();
  const ffprobePath = resolveFfprobePath(ffmpegPath);
  const tempFiles: string[] = [];
  let command = '';
  let stderr = '';
  let inputPath = '';
  let finalPath = '';
  let retainInputOnFfmpegFailure = false;
  const startedAt = Date.now();

  try {
    const formData = await req.formData();
    const file = (formData.get('file') || formData.get('video')) as File | null;
    if (!file) return NextResponse.json({ ok: false, error: { code: 'NO_INPUT', tail: [] } }, { status: 400 });

    const inputExt = file.name.toLowerCase().endsWith('.mp4') ? '.mp4' : '.webm';
    inputPath = getLocalTempFilePath('raw_in', inputExt);
    const outputTempPath = getLocalTempFilePath('out', '.tmp.mp4');
    finalPath = getLocalTempFilePath('out_final', '.mp4');
    tempFiles.push(inputPath, outputTempPath, finalPath);
    const uploadBuffer = Buffer.from(await file.arrayBuffer());
    const recordedBytesValue = formData.get('recordedBytes');
    const declaredRecordedBytes = recordedBytesValue === null ? null : Number(recordedBytesValue);
    if (
      uploadBuffer.length === 0 ||
      uploadBuffer.length !== file.size ||
      (declaredRecordedBytes !== null &&
        (!Number.isSafeInteger(declaredRecordedBytes) || declaredRecordedBytes !== uploadBuffer.length))
    ) {
      throw Object.assign(new Error('The uploaded recording is incomplete or failed its byte-length integrity check.'), {
        code: 'INCOMPLETE_UPLOAD',
      });
    }
    await fs.promises.writeFile(inputPath, uploadBuffer, { mode: 0o666 });
    const writtenInput = await fs.promises.stat(inputPath);
    if (writtenInput.size !== uploadBuffer.length) {
      throw Object.assign(new Error('The uploaded recording was not fully written before export.'), {
        code: 'INCOMPLETE_UPLOAD',
      });
    }

    const tempDir = getLocalTempDir();
    const disk = await fs.promises.statfs(tempDir);
    const availableBytes = Number(disk.bavail) * Number(disk.bsize);
    const requiredBytes = file.size * 3 + 64 * 1024 * 1024;
    if (availableBytes < requiredBytes) throw Object.assign(new Error('Insufficient disk space for video export.'), { code: 'INSUFFICIENT_DISK_SPACE' });

    const resolution = (formData.get('resolution') as string | null) || '720p';
    if (!['720p', '1080p'].includes(resolution)) throw Object.assign(new Error('Unsupported export resolution.'), { code: 'INVALID_RESOLUTION' });
    const encodingPreset = formData.get('normalizeExport') === 'true' ? 'ultrafast' : 'veryfast';
    const h264 = getExplicitH264Config(resolution, FPS);
    const durationValue = formData.get('duration');
    const requestedDuration = durationValue === null ? null : Number(durationValue);
    if (requestedDuration !== null && (!Number.isFinite(requestedDuration) || requestedDuration <= 0 || requestedDuration > 21600)) {
      throw Object.assign(new Error('The requested export duration is invalid.'), { code: 'INVALID_DURATION' });
    }

    const initialDiagnostics = await collectVideoDiagnostics(ffprobePath, inputPath, '', requestedDuration, 0);
    const inputVideo = initialDiagnostics.data.input?.streams?.some((stream) => stream.codec_type === 'video');
    const hasAudio = initialDiagnostics.data.input?.streams?.some((stream) => stream.codec_type === 'audio') ?? false;
    if (!inputVideo) throw Object.assign(new Error('ffprobe could not find a readable video stream.'), { code: 'INPUT_PROBE_FAILED' });

    let subtitlePath: string | null = null;
    const subtitleFile = formData.get('subtitles');
    if (subtitleFile instanceof File && subtitleFile.size > 0) {
      const extension = path.extname(subtitleFile.name).toLowerCase();
      if (extension !== '.ass' && extension !== '.srt') {
        throw Object.assign(new Error('Subtitle file must use .ass or .srt format.'), { code: 'INVALID_SUBTITLES' });
      }
      subtitlePath = getLocalTempFilePath('captions', extension);
      tempFiles.push(subtitlePath);
      await fs.promises.writeFile(subtitlePath, Buffer.from(await subtitleFile.arrayBuffer()), { mode: 0o666 });
    }

    console.info('[repair-video] Using normalizeExport profile.');

    const subtitleAttempts = subtitlePath
      ? [
          { path: subtitlePath, font: 'Noto Sans Ethiopic', label: null as string | null },
          { path: subtitlePath, font: 'Abyssinica SIL', label: 'Subtitle fallback font (Abyssinica SIL) was used.' },
          { path: null, font: '', label: 'Subtitle rendering failed; the export continued without the separate subtitle file.' },
        ]
      : [{ path: null, font: '', label: null as string | null }];

    let result: CommandResult | null = null;
    let usedFallback: string | null = null;
    const timeoutMs = Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, (requestedDuration ?? 30) * 20_000));
    const makeArgs = (
      attempt: { path: string | null; font: string },
      syncArgs: string[]
    ) => [
      '-nostdin', '-hide_banner', '-y', '-loglevel', 'error',
      '-fflags', '+genpts', '-i', inputPath,
      '-map', '0:v:0',
      ...(hasAudio ? ['-map', '0:a:0?'] : []),
      '-vf', makeVideoFilter(attempt.path, attempt.font),
      '-r', String(FPS),
      ...syncArgs,
      '-c:v', 'libx264', '-preset', encodingPreset, '-crf', '21',
      '-profile:v', 'high', '-level:v', h264.level,
      '-pix_fmt', 'yuv420p',
      '-g', '60', '-keyint_min', '30', '-sc_threshold', '0', '-bf', '2',
      ...(hasAudio ? [
        '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-ac', '2',
        '-af', 'aresample=async=1000:first_pts=0',
      ] : []),
      '-avoid_negative_ts', 'make_zero',
      '-movflags', '+faststart', '-video_track_timescale', '90000',
      '-progress', 'pipe:1',
      ...(requestedDuration === null ? [] : ['-t', requestedDuration.toFixed(3)]),
      outputTempPath,
    ];

    for (const attempt of subtitleAttempts) {
      let args = makeArgs(attempt, ['-fps_mode', 'cfr']);
      command = formatCommand(ffmpegPath, args);
      console.info(`[repair-video] Exact FFmpeg command: ${command}`);
      result = await runCommand(ffmpegPath, args, timeoutMs);
      stderr = result.stderr;
      if (doesNotSupportFpsMode(stderr)) {
        console.warn('[repair-video] FFmpeg does not support -fps_mode; retrying with the legacy CFR option.');
        await fs.promises.unlink(outputTempPath).catch(() => {});
        args = makeArgs(attempt, ['-vsync', 'cfr']);
        command = formatCommand(ffmpegPath, args);
        console.info(`[repair-video] Exact FFmpeg compatibility command: ${command}`);
        result = await runCommand(ffmpegPath, args, timeoutMs);
        stderr = result.stderr;
      }
      console.info(`[repair-video] FFmpeg stdout/progress:\n${result.stdout}`);
      if (result.stderr) console.error(`[repair-video] FFmpeg stderr:\n${result.stderr}`);
      if (!result.error && result.exitCode === 0) {
        usedFallback = attempt.label;
        break;
      }
      if (!attempt.path) break;
      await fs.promises.unlink(outputTempPath).catch(() => {});
    }

    if (!result || result.error || result.exitCode !== 0) {
      retainInputOnFfmpegFailure = true;
      throw Object.assign(result?.error || new Error(`FFmpeg exited with code ${result?.exitCode ?? 'unknown'}`), {
        code: result?.error?.message.includes('timed out') ? 'FFMPEG_TIMEOUT' : `FFMPEG_EXIT_${result?.exitCode ?? 'UNKNOWN'}`,
      });
    }

    const tempStats = await fs.promises.stat(outputTempPath);
    if (tempStats.size <= 0) throw Object.assign(new Error('FFmpeg produced an empty output file.'), { code: 'EMPTY_OUTPUT' });
    await fs.promises.rename(outputTempPath, finalPath);
    await validateMp4(ffmpegPath, finalPath);

    const outputStats = await fs.promises.stat(finalPath);
    const diagnostics = await collectVideoDiagnostics(ffprobePath, inputPath, finalPath, requestedDuration, outputStats.size);
    const { checks, warnings } = checkOutput(diagnostics);
    if (usedFallback) warnings.unshift(usedFallback);
    console.info(`[repair-video] Output diagnostics:\n${diagnostics.report}`);
    console.info(`[repair-video] Export checks: ${JSON.stringify(checks)}; warnings: ${JSON.stringify(warnings)}`);

    const video = await fs.promises.readFile(finalPath);
    const filename = `${path.basename((formData.get('filename') as string | null) || 'bgern_video.mp4').replace(/[^a-zA-Z0-9_.-]/g, '_').replace(/\.mp4$/i, '')}.mp4`;
    const headers = new Headers({
      'Content-Type': 'video/mp4',
      'Content-Length': String(video.length),
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Export-Checks': JSON.stringify(checks),
      'X-Export-Warnings': encodeURIComponent(JSON.stringify(warnings)),
      'X-Export-Duration-Ms': String(Date.now() - startedAt),
    });
    return new NextResponse(video, { status: 200, headers });
  } catch (error) {
    const failure = error instanceof Error ? error : new Error(String(error));
    const code = typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : 'EXPORT_FAILED';
    console.error(`[repair-video] Failed command: ${command || '(FFmpeg did not start)'}`);
    console.error(`[repair-video] Export error (${code}):`, failure);
    return NextResponse.json(
      { ok: false, error: { code, tail: tail(stderr) } },
      { status: 500 }
    );
  } finally {
    await Promise.all(
      tempFiles
        .filter((filePath) => !(retainInputOnFfmpegFailure && filePath === inputPath))
        .map((filePath) => fs.promises.unlink(filePath).catch(() => {}))
    );
  }
}
