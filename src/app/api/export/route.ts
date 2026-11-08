import { NextRequest, NextResponse } from 'next/server';
import { spawn, spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import { getLocalTempDir, getLocalTempFilePath } from '@/lib/temp-dir';
import {
  generateAssSubtitles,
  CaptionSegment,
  CaptionStyleOptions,
} from '@/lib/ass-subtitles';
import { probeMedia, validateExportedVideo } from '@/lib/video-validation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 1800;

type ExportJob = {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  fileName?: string;
  error?: string;
  warnings?: string[];
  createdAt: number;
};

const activeJobs = new Map<string, ExportJob>();
const MAX_UPLOAD_BYTES = Number(process.env.MAX_EXPORT_UPLOAD_BYTES || 500 * 1024 * 1024);
const JOB_TTL_MS = 60 * 60 * 1000;

function getJobFilePath(jobId: string): string {
  const safeId = jobId.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(getLocalTempDir(), `job_${safeId}.json`);
}

function setExportJob(jobId: string, patch: Partial<ExportJob> & { id?: string }): ExportJob {
  // Try disk first so cross-process updates don't clobber each other
  let existing = activeJobs.get(jobId);
  if (!existing) {
    try {
      const jobPath = getJobFilePath(jobId);
      if (fs.existsSync(jobPath)) {
        const parsed = JSON.parse(fs.readFileSync(jobPath, 'utf8')) as ExportJob;
        if (parsed && parsed.id) existing = parsed;
      }
    } catch {}
  }
  if (!existing) {
    existing = { id: jobId, status: 'processing', progress: 0, createdAt: Date.now() };
  }
  const updated: ExportJob = { ...existing, ...patch, id: jobId };
  activeJobs.set(jobId, updated);

  // Write to disk atomically via temp-file rename where supported, else direct write
  try {
    const jobPath = getJobFilePath(jobId);
    const tmpPath = jobPath + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(updated), 'utf8');
    fs.renameSync(tmpPath, jobPath);
  } catch {
    try {
      fs.writeFileSync(getJobFilePath(jobId), JSON.stringify(updated), 'utf8');
    } catch {}
  }

  return updated;
}

function getExportJob(jobId: string): ExportJob | null {
  try {
    const jobPath = getJobFilePath(jobId);
    if (fs.existsSync(jobPath)) {
      const parsed = JSON.parse(fs.readFileSync(jobPath, 'utf8')) as ExportJob;
      if (parsed && parsed.id) {
        // Sync to memory so same-process reads are fast
        activeJobs.set(jobId, parsed);
        return parsed;
      }
    }
  } catch {}
  return activeJobs.get(jobId) || null;
}

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [id, job] of activeJobs) {
    if (now - job.createdAt > JOB_TTL_MS) {
      activeJobs.delete(id);
      try {
        const p = getJobFilePath(id);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      } catch {}
    }
  }
}, 10 * 60 * 1000);
cleanupTimer.unref?.();

/**
 * Prefer an explicitly configured binary, then a working system binary,
 * then standard hosting paths, then the bundled npm package binary.
 */
function executableWorks(executable: string, args: string[] = ['-version']): boolean {
  try {
    const result = spawnSync(executable, args, {
      encoding: 'utf8',
      timeout: 10_000,
      maxBuffer: 2 * 1024 * 1024,
    });
    return !result.error && result.status === 0;
  } catch {
    return false;
  }
}

function getFfmpegPath(): string {
  const configured = process.env.FFMPEG_PATH;
  if (configured && fs.existsSync(configured) && executableWorks(configured)) return configured;

  if (executableWorks('ffmpeg')) return 'ffmpeg';

  const candidatePaths = [
    '/usr/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
    '/usr/bin/local/ffmpeg',
    '/bin/ffmpeg',
    path.join(process.env.HOME || '', 'bin', 'ffmpeg'),
    path.join(process.env.HOME || '', '.local', 'bin', 'ffmpeg'),
  ];
  for (const c of candidatePaths) {
    if (c && fs.existsSync(c) && executableWorks(c)) return c;
  }

  const bundled = ffmpegInstaller?.path;
  if (bundled && fs.existsSync(bundled) && executableWorks(bundled)) return bundled;

  throw new Error(
    'FFmpeg executable was not found or cannot run. Configure FFMPEG_PATH in your hosting environment.',
  );
}

function getFfprobePath(): string {
  const configured = process.env.FFPROBE_PATH;
  if (configured && fs.existsSync(configured) && executableWorks(configured)) return configured;

  if (executableWorks('ffprobe')) return 'ffprobe';

  const candidatePaths = [
    '/usr/bin/ffprobe',
    '/usr/local/bin/ffprobe',
    '/usr/bin/local/ffprobe',
    '/bin/ffprobe',
    path.join(process.env.HOME || '', 'bin', 'ffprobe'),
    path.join(process.env.HOME || '', '.local', 'bin', 'ffprobe'),
  ];
  for (const c of candidatePaths) {
    if (c && fs.existsSync(c) && executableWorks(c)) return c;
  }

  const bundled = (ffprobeInstaller as any)?.path as string | undefined;
  if (bundled && fs.existsSync(bundled) && executableWorks(bundled)) return bundled;

  throw new Error(
    'FFprobe executable was not found or cannot run. Configure FFPROBE_PATH in your hosting environment.',
  );
}

function runCapture(executable: string, args: string[], timeout = 10_000): string {
  const result = spawnSync(executable, args, {
    encoding: 'utf8',
    timeout,
    maxBuffer: 2 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `${executable} failed`).slice(-3000));
  }
  return `${result.stdout || ''}${result.stderr || ''}`;
}

function even(value: number): number {
  const n = Math.floor(Number.isFinite(value) ? value : 0);
  return Math.max(2, n - (n % 2));
}

function parseFps(value?: string): number {
  if (!value) return 0;
  const [numerator, denominator] = value.split('/').map(Number);
  if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator > 0) {
    return numerator / denominator;
  }
  return Number(value) || 0;
}

/**
 * Maps CSS/UI font family names to their actual font files in public/fonts/.
 * Returns the resolved {fontFile, fontFamily} pair that FFmpeg libass can load.
 * Falls back to Noto Sans Ethiopic when the requested font is not available locally.
 *
 * IMPORTANT: The Fontname in the ASS [V4+ Styles] section MUST match the
 * actual family name embedded in the font file — not the CSS name, file basename,
 * or display label. FFmpeg libass uses this name to look up the font inside fontsdir.
 */
function resolveFontForExport(
  requestedFamily: string | undefined,
  fontsDir: string,
): { fontFile: string; assFamily: string } {
  const DEFAULT_FILE = 'NotoSansEthiopic-Regular.ttf';
  const DEFAULT_FAMILY = 'Noto Sans Ethiopic';

  // Mapping from UI/CSS font family name  →  { file in public/fonts/, ASS family name }
  // ASS family names were verified by opening each TTF in a font viewer.
  const FONT_MAP: Record<string, { file: string; family: string }> = {
    'Noto Sans Ethiopic':          { file: 'NotoSansEthiopic-Regular.ttf', family: 'Noto Sans Ethiopic' },
    'NotoSansEthiopic':            { file: 'NotoSansEthiopic-Regular.ttf', family: 'Noto Sans Ethiopic' },
    'Noto Sans':                   { file: 'NotoSans-Regular.ttf',         family: 'Noto Sans' },
    'SurGraphics Black':           { file: 'surgraphics-black.ttf',        family: 'SurGraphics Black' },
    'surgraphics-black':           { file: 'surgraphics-black.ttf',        family: 'SurGraphics Black' },
    'Zemenay':                     { file: 'zemenay.ttf',                  family: 'Zemenay' },
    'Bela Bereka':                 { file: 'bela-bereka.ttf',              family: 'Bela Bereka' },
    'Loga Display':                { file: 'loga-display.ttf',             family: 'Loga Display' },
    'Geez Digital':                { file: 'geez-digital.ttf',             family: 'Geez Digital' },
    'Waldba Wookianos':            { file: 'waldba-wookianos.ttf',         family: 'Waldba Wookianos' },
    'Abyssinica SIL Connected':    { file: 'abyssinica-sil-connected.ttf', family: 'Abyssinica SIL Connected' },
    'Ethiopic Lessan':             { file: 'ethiopic-lessan.ttf',          family: 'Ethiopic Lessan' },
    'Amhara Reduced':              { file: 'amhara-reduced.otf',           family: 'Amhara Reduced' },
    'HH Lemd Mono':                { file: 'hh-lemd-mono.otf',             family: 'HH Lemd Mono' },
  };

  const key = (requestedFamily || '').trim();
  const entry = FONT_MAP[key];

  if (entry) {
    const fullPath = path.join(fontsDir, entry.file);
    if (fs.existsSync(fullPath)) {
      console.log(`[export] Font resolved: "${key}" → ${entry.file} (family: "${entry.family}")`);
      return { fontFile: entry.file, assFamily: entry.family };
    }
    console.warn(`[export] Font file missing for "${key}": ${fullPath} — falling back to Noto Sans Ethiopic`);
  } else {
    console.warn(`[export] Unknown font family "${key}" — falling back to Noto Sans Ethiopic`);
  }

  // Always fall back to Noto Sans Ethiopic which is guaranteed to be present
  const fallbackPath = path.join(fontsDir, DEFAULT_FILE);
  if (!fs.existsSync(fallbackPath)) {
    throw new Error(`Default fallback font not found: ${fallbackPath}. Ensure NotoSansEthiopic-Regular.ttf is in public/fonts/.`);
  }
  return { fontFile: DEFAULT_FILE, assFamily: DEFAULT_FAMILY };
}

/**
 * ASS Fontname must be a font family name, not a filesystem path.
 * Resolve path-like font names to the actual family using fontconfig where
 * possible. The fonts themselves are still loaded from the fontsdir folder.
 */
function normalizeAssFontNames(ass: string, fontsDir: string): string {
  const lines = ass.split(/\r?\n/);
  let styleFormat: string[] | null = null;

  return lines.map((line) => {
    if (/^\s*Format\s*:/i.test(line) && styleFormat === null) {
      styleFormat = line.replace(/^\s*Format\s*:/i, '').split(',').map((v) => v.trim().toLowerCase());
      return line;
    }

    if (!/^\s*Style\s*:/i.test(line) || !styleFormat) return line;

    const prefix = line.match(/^(\s*Style\s*:\s*)/i)?.[0] || 'Style: ';
    const values = line.slice(prefix.length).split(',');
    const fontIndex = styleFormat.indexOf('fontname');
    if (fontIndex < 0 || !values[fontIndex]) return line;

    const original = values[fontIndex].trim().replace(/^['"]|['"]$/g, '');
    if (!original.includes('/') && !/\.ttf$|\.otf$|\.ttc$/i.test(original)) return line;

    const basename = path.basename(original);
    const fontPath = path.join(fontsDir, basename);
    if (!fs.existsSync(fontPath)) {
      throw new Error(`Subtitle font not found: ${basename}. Check the Fontname in the ASS subtitle generator and public/fonts.`);
    }

    let family = '';
    try {
      family = runCapture('fc-scan', ['--format', '%{family}', fontPath], 5000).trim().split(',')[0].trim();
    } catch {
      // Fallback is only used if fontconfig's scanner is unavailable.
      family = basename.replace(/\.(ttf|otf|ttc)$/i, '').replace(/[-_]+/g, ' ');
    }

    values[fontIndex] = family || basename.replace(/\.(ttf|otf|ttc)$/i, '');
    return `${prefix}${values.join(',')}`;
  }).join('\n');
}

/**
 * Escape a path for use inside a quoted FFmpeg filter option.
 */
function escapeFilterPath(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/,/g, '\\,')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/;/g, '\\;');
}

function safeUploadPath(fileName: string): string {
  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
  const resolved = path.resolve(uploadsDir, path.basename(fileName));
  if (!resolved.startsWith(`${uploadsDir}${path.sep}`)) {
    throw new Error('Invalid output filename.');
  }
  return resolved;
}

function isPrivateOrLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
  if (host === '::1' || host === '::') return true;
  if (/^(10\.|127\.|169\.254\.|192\.168\.|0\.)/.test(host)) return true;
  const match = host.match(/^172\.(\d+)\./);
  if (match && Number(match[1]) >= 16 && Number(match[1]) <= 31) return true;
  return false;
}

async function resolveInputFile(
  videoFile: File | null,
  storedFileId: string | null,
): Promise<{ filePath: string; isTemporary: boolean }> {
  if (videoFile) {
    if (videoFile.size <= 0) throw new Error('The uploaded video is empty.');
    if (videoFile.size > MAX_UPLOAD_BYTES) {
      throw new Error(`Video exceeds the upload limit of ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`);
    }

    const ext = path.extname(videoFile.name).toLowerCase();
    const allowed = new Set(['.mp4', '.mov', '.m4v', '.webm', '.mkv', '.avi']);
    const safeExt = allowed.has(ext) ? ext : '.mp4';
    const tempPath = getLocalTempFilePath('export_src', safeExt);
    await fs.promises.writeFile(tempPath, Buffer.from(await videoFile.arrayBuffer()));
    return { filePath: tempPath, isTemporary: true };
  }

  if (!storedFileId) throw new Error('No video file or stored fileId provided.');

  // Local paths are restricted to public/uploads or public/
  if (storedFileId.startsWith('/') || storedFileId.includes('/uploads/')) {
    const cleanId = storedFileId.split('?')[0].split('#')[0];
    let decodedId = cleanId;
    try { decodedId = decodeURIComponent(cleanId); } catch {}

    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
    const marker = decodedId.indexOf('/uploads/');
    const relative = marker >= 0
      ? decodedId.slice(marker + '/uploads/'.length)
      : decodedId.replace(/^\/+/, '').replace(/^uploads\//, '');
    const candidate = path.resolve(uploadsDir, relative);
    if (candidate.startsWith(`${uploadsDir}${path.sep}`) && fs.existsSync(candidate)) {
      return { filePath: candidate, isTemporary: false };
    }

    // Check public root directory as well (e.g. sample-video.mp4)
    const publicDir = path.resolve(process.cwd(), 'public');
    const relPublic = decodedId.replace(/^\/+/, '');
    const candidatePublic = path.resolve(publicDir, relPublic);
    if (candidatePublic.startsWith(`${publicDir}${path.sep}`) && fs.existsSync(candidatePublic)) {
      return { filePath: candidatePublic, isTemporary: false };
    }

    throw new Error(`Stored video was not found on server (${relative || decodedId}). Please re-upload your video.`);
  }

  // Remote URL support
  if (/^https?:\/\//i.test(storedFileId)) {
    const remote = new URL(storedFileId);

    // If pointing to our domain /uploads/... resolve directly on disk
    if (remote.pathname.includes('/uploads/')) {
      const rel = remote.pathname.slice(remote.pathname.indexOf('/uploads/') + '/uploads/'.length);
      let decodedRel = rel;
      try { decodedRel = decodeURIComponent(rel); } catch {}
      const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
      const candidate = path.resolve(uploadsDir, decodedRel);
      if (candidate.startsWith(`${uploadsDir}${path.sep}`) && fs.existsSync(candidate)) {
        return { filePath: candidate, isTemporary: false };
      }
    }

    if (remote.protocol !== 'https:' || isPrivateOrLocalHost(remote.hostname)) {
      throw new Error('Only public HTTPS video URLs are supported.');
    }

    const response = await fetch(remote, { redirect: 'error', signal: AbortSignal.timeout(60_000) });
    if (!response.ok) throw new Error(`Could not fetch stored video (HTTP ${response.status}).`);

    const declaredLength = Number(response.headers.get('content-length') || 0);
    if (declaredLength > MAX_UPLOAD_BYTES) throw new Error('Remote video exceeds the configured size limit.');

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength <= 0 || arrayBuffer.byteLength > MAX_UPLOAD_BYTES) {
      throw new Error('Remote video is empty or exceeds the configured size limit.');
    }

    const tempPath = getLocalTempFilePath('export_src', '.mp4');
    await fs.promises.writeFile(tempPath, Buffer.from(arrayBuffer));
    return { filePath: tempPath, isTemporary: true };
  }

  throw new Error('Invalid video reference. Supply an uploaded file or a valid video URL.');
}

function parseSegments(value: unknown): CaptionSegment[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item: any) =>
      item &&
      typeof item.text === 'string' &&
      Number.isFinite(Number(item.start)) &&
      Number.isFinite(Number(item.end)) &&
      Number(item.end) > Number(item.start),
    )
    .map((item: any) => ({
      ...item,
      start: Math.max(0, Number(item.start)),
      end: Number(item.end),
      text: String(item.text),
    }));
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const jobId = url.searchParams.get('jobId');
  const fileParam = url.searchParams.get('file');

  if (url.searchParams.get('action') === 'diagnose' || url.searchParams.has('diagnose')) {
    const { GET: diagnoseHandler } = await import('./diagnose/route');
    return diagnoseHandler(req);
  }

  if (jobId && !fileParam) {
    const job = getExportJob(jobId);
    if (!job) return NextResponse.json({ success: false, error: 'Export job not found' }, { status: 404 });
    return NextResponse.json({ success: true, ...job });
  }

  if (fileParam) {
    let filePath: string;
    try {
      filePath = safeUploadPath(fileParam);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid filename' }, { status: 400 });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    const stat = await fs.promises.stat(filePath);
    const stream = fs.createReadStream(filePath);
    return new Response(stream as any, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': String(stat.size),
        'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  }

  return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  let jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  let inputPath = '';
  let inputIsTemporary = false;
  let assPath = '';
  let outputPath = '';
  let keepOutput = false;

  try {
    const ffmpegPath = getFfmpegPath();
    const ffprobePath = getFfprobePath();
    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
    const fontsDir = path.resolve(process.cwd(), 'public', 'fonts');

    await fs.promises.mkdir(uploadsDir, { recursive: true });
    if (!fs.existsSync(fontsDir)) {
      throw new Error(`Fonts directory does not exist: ${fontsDir}`);
    }

    let videoFile: File | null = null;
    let storedFileId: string | null = null;
    let qualityParam = '1080p';
    let segments: CaptionSegment[] = [];
    let captionStyle: CaptionStyleOptions = {};

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const clientJobId = formData.get('jobId');
      if (typeof clientJobId === 'string' && clientJobId.trim()) {
        jobId = clientJobId.trim();
      }

      const fileEntry = formData.get('video');
      if (fileEntry instanceof File) videoFile = fileEntry;

      const fileIdEntry = formData.get('fileId') || formData.get('url');
      if (typeof fileIdEntry === 'string') storedFileId = fileIdEntry;

      const qualityEntry = formData.get('quality');
      if (typeof qualityEntry === 'string') qualityParam = qualityEntry;

      const segmentsEntry = formData.get('subtitles') || formData.get('segments');
      if (typeof segmentsEntry === 'string') {
        try { segments = parseSegments(JSON.parse(segmentsEntry)); } catch {}
      }

      const styleEntry = formData.get('style') || formData.get('captionStyle');
      if (typeof styleEntry === 'string') {
        try { captionStyle = JSON.parse(styleEntry); } catch {}
      }
    } else {
      const json = await req.json().catch(() => ({}));
      if (typeof json.jobId === 'string' && json.jobId.trim()) {
        jobId = json.jobId.trim();
      }
      if (typeof json.fileId === 'string' || typeof json.url === 'string') {
        storedFileId = json.fileId || json.url;
      }
      if (typeof json.quality === 'string') qualityParam = json.quality;
      if (Array.isArray(json.subtitles || json.segments)) {
        segments = parseSegments(json.subtitles || json.segments);
      }
      if (json.style && typeof json.style === 'object') {
        captionStyle = json.style;
      }
    }

    // Register job immediately so poller and multi-process Passenger see it right away
    setExportJob(jobId, {
      id: jobId,
      status: 'processing',
      progress: 0,
      createdAt: Date.now(),
    });

    if (segments.length === 0) {
      throw new Error('No valid subtitle segments provided for export.');
    }

    const quality: '720p' | '1080p' | 'original' =
      qualityParam === '720p' ? '720p' : qualityParam === 'original' ? 'original' : '1080p';

    const input = await resolveInputFile(videoFile, storedFileId);
    inputPath = input.filePath;
    inputIsTemporary = input.isTemporary;

    const sourceProbe = await probeMedia(ffprobePath, inputPath);
    const videoStream = (sourceProbe.streams || []).find((s: any) => s.codec_type === 'video');
    const audioStream = (sourceProbe.streams || []).find((s: any) => s.codec_type === 'audio');

    if (!videoStream) throw new Error('Source media contains no valid video stream.');

    const sourceWidth = Number(videoStream.width) || 0;
    const sourceHeight = Number(videoStream.height) || 0;
    if (sourceWidth < 2 || sourceHeight < 2) throw new Error('Source video has invalid dimensions.');

    const landscape = sourceWidth >= sourceHeight;
    const longSide = Math.max(sourceWidth, sourceHeight);
    const shortSide = Math.min(sourceWidth, sourceHeight);

    function computeDimensionsAndScale(qual: '720p' | '1080p' | 'original') {
      let sFilter = 'scale=trunc(iw/2)*2:trunc(ih/2)*2';
      let tW = even(sourceWidth);
      let tH = even(sourceHeight);

      const maxDim = qual === '720p' ? 720 : qual === '1080p' ? 1080 : 1920;
      if (qual !== 'original' || longSide > 1920) {
        if (shortSide >= maxDim || (qual === 'original' && longSide > 1920)) {
          if (landscape) {
            tH = even(maxDim);
            tW = even(sourceWidth * (tH / sourceHeight));
            sFilter = `scale=-2:${tH}`;
          } else {
            tW = even(maxDim);
            tH = even(sourceHeight * (tW / sourceWidth));
            sFilter = `scale=${tW}:-2`;
          }
        }
      }
      return { targetWidth: tW, targetHeight: tH, scaleFilter: sFilter };
    }

    const initialDim = computeDimensionsAndScale(quality);
    let targetWidth = initialDim.targetWidth;
    let targetHeight = initialDim.targetHeight;
    let scaleFilter = initialDim.scaleFilter;

    const sourceFps = parseFps(videoStream.avg_frame_rate) || parseFps(videoStream.r_frame_rate);
    const targetFps = Math.min(60, Math.max(24, [24, 25, 30, 50, 60].includes(Math.round(sourceFps)) ? Math.round(sourceFps) : 30));
    const duration = Number(videoStream.duration || sourceProbe.format?.duration || 0);
    if (!Number.isFinite(duration) || duration <= 0) throw new Error('Could not determine source video duration.');

    assPath = getLocalTempFilePath('subtitles', '.ass');

    // Resolve the CSS/UI font family name to an actual font file present in public/fonts/.
    // This is critical: FFmpeg libass looks up fonts by family name inside the fontsdir.
    // If the requested font (e.g. "Montserrat") is not in fontsdir, libass silently renders
    // no captions. We always fall back to Noto Sans Ethiopic which is guaranteed to exist.
    const { assFamily: resolvedFontFamily } = resolveFontForExport(captionStyle.fontFamily, fontsDir);
    console.log(`[export] segments: ${segments.length}, font: "${captionStyle.fontFamily}" → ASS: "${resolvedFontFamily}"`);

    const updateAssFile = async (w: number, h: number) => {
      const assContent = generateAssSubtitles({
        segments,
        videoWidth: w,
        videoHeight: h,
        style: { ...captionStyle, fontFamily: resolvedFontFamily },
      });
      // normalizeAssFontNames only applies when the ASS Fontname is a file path — after
      // resolveFontForExport the name is already a clean family name so it's a no-op here,
      // but we keep it as a safety net for any legacy path-like names.
      const normalizedAss = normalizeAssFontNames(assContent, fontsDir);
      await fs.promises.writeFile(assPath, normalizedAss, 'utf8');
    };

    await updateAssFile(targetWidth, targetHeight);

    const fileName = `bgern_export_${quality}_${Date.now()}.mp4`;
    outputPath = path.join(uploadsDir, fileName);

    // Fail early with a useful diagnostic if this FFmpeg build lacks libx264.
    const encoders = runCapture(ffmpegPath, ['-hide_banner', '-encoders']);
    if (!encoders.includes('libx264')) {
      throw new Error('This FFmpeg build does not include the libx264 encoder. Configure FFMPEG_PATH to a build with libx264 support.');
    }

    // Check if the subtitle filter (libass) is available. If not, captions can't be burned in.
    const availableFilters = runCapture(ffmpegPath, ['-hide_banner', '-filters']);
    const hasSubtitlesFilter = availableFilters.includes('subtitles');
    const hasAssFilter = availableFilters.includes(' ass ');
    if (!hasSubtitlesFilter && !hasAssFilter) {
      throw new Error('This FFmpeg build does not include libass (subtitles/ass filter). Captions cannot be burned. Configure FFMPEG_PATH to a build with libass support.');
    }
    console.log(`[export] FFmpeg subtitle filters: subtitles=${hasSubtitlesFilter}, ass=${hasAssFilter}`);

    const buildFfmpegArgs = (attempt: number, curWidth: number, curHeight: number, curScaleFilter: string) => {
      // Use 'subtitles' filter (preferred) or fall back to 'ass' filter, both backed by libass.
      const subtitleFilter = hasSubtitlesFilter
        ? `subtitles=filename='${escapeFilterPath(assPath)}':fontsdir='${escapeFilterPath(fontsDir)}'`
        : `ass='${escapeFilterPath(assPath)}'`;
      const videoFilter = `setpts=PTS-STARTPTS,${curScaleFilter},fps=${targetFps},${subtitleFilter}`;

      const decoderThreads = attempt === 1 ? '2' : '1';

      const args: string[] = [
        '-hide_banner',
        '-y',
        '-nostdin',
        '-threads', decoderThreads,
        '-loglevel', 'warning',
        '-progress', 'pipe:1',
        '-threads', decoderThreads,
        '-i', inputPath,
      ];

      if (!audioStream) {
        args.push(
          '-f', 'lavfi',
          '-t', String(duration),
          '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
        );
      }

      const encodeArgs = [
        '-map', '0:v:0',
        '-map', audioStream ? '0:a:0?' : '1:a:0',
        '-vf', videoFilter,
        '-r', String(targetFps),
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
      ];

      // Multi-threaded encoding: attempt 1 uses 2 threads for fast rendering while staying well
      // inside CloudLinux LVE limits; attempt 2 falls back to 1 thread if needed.
      const encThreads = attempt === 1 ? '2' : '1';
      encodeArgs.push(
        '-threads', encThreads,
      );

      // Strict Constant Frame Rate (CFR), Closed GOP (+cgop), and faststart
      // to guarantee zero frame freezing and instant smooth playback on all local media players.
      // -vsync 1 is universally supported across all FFmpeg builds (3.x through 7.x).
      encodeArgs.push(
        '-vsync', '1',
        '-profile:v', 'main',
        '-level', '4.1',
        '-flags', '+cgop',
        '-g', String(targetFps * 2),
        '-keyint_min', String(targetFps * 2),
        '-sc_threshold', '0',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-ar', '44100',
        '-ac', '2',
        '-af', 'aresample=async=1000:first_pts=0,apad',
        '-t', String(duration),
        '-avoid_negative_ts', 'make_zero',
        '-max_muxing_queue_size', '2048',
        '-movflags', '+faststart',
        outputPath,
      );

      return args.concat(encodeArgs);
    };

    setExportJob(jobId, {
      id: jobId,
      status: 'processing',
      progress: 0,
      createdAt: Date.now(),
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        let controllerClosed = false;
        let currentChild: any = null;
        let currentAttempt = 1;
        const maxAttempts = 3;
        let pingTimer: any = null;

        const send = (payload: Record<string, unknown>) => {
          if (controllerClosed) return;
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          } catch {
            controllerClosed = true;
          }
        };

        const close = () => {
          if (pingTimer) clearInterval(pingTimer);
          if (controllerClosed) return;
          controllerClosed = true;
          try { controller.close(); } catch {}
        };

        // Flush 2KB whitespace comment immediately so Apache/Passenger/LiteSpeed proxies flush HTTP headers
        try {
          controller.enqueue(encoder.encode(`: ${' '.repeat(2048)}\n\n`));
        } catch {}

        send({ type: 'start', jobId, targetW: targetWidth, targetH: targetHeight, targetFps, quality });

        // Heartbeat ping every 2.5s keeps the HTTP stream active through any proxy/gateway timeouts
        pingTimer = setInterval(() => {
          if (controllerClosed) {
            clearInterval(pingTimer);
            return;
          }
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch {
            controllerClosed = true;
            clearInterval(pingTimer);
          }
        }, 2500);

        const startProcess = async (attempt: number) => {
          let curW = targetWidth;
          let curH = targetHeight;
          let curScale = scaleFilter;

          if (attempt === 3) {
            const p720 = computeDimensionsAndScale('720p');
            curW = p720.targetWidth;
            curH = p720.targetHeight;
            curScale = p720.scaleFilter;
            await updateAssFile(curW, curH);
          }

          const currentArgs = buildFfmpegArgs(attempt, curW, curH, curScale);

          let stdoutBuffer = '';
          let stderrData = '';
          let lastPercent = -1;
          let processSettled = false;

          try {
            currentChild = spawn(ffmpegPath, currentArgs, {
              stdio: ['ignore', 'pipe', 'pipe'],
              windowsHide: true,
            });
          } catch (error: any) {
            const message = error?.message || 'Could not start FFmpeg.';
            setExportJob(jobId, { status: 'failed', error: message });
            send({ type: 'error', error: message });
            cleanup();
            close();
            return;
          }

          currentChild.stdout.on('data', (chunk: Buffer) => {
            stdoutBuffer += chunk.toString();
            const lines = stdoutBuffer.split(/\r?\n/);
            stdoutBuffer = lines.pop() || '';

            for (const line of lines) {
              const match = line.match(/^out_time_(?:us|ms)=(\d+)/);
              if (!match) continue;
              const currentSeconds = Number(match[1]) / 1_000_000;
              const percent = Math.min(96, Math.max(1, Math.round((currentSeconds / duration) * 100)));
              if (percent !== lastPercent) {
                lastPercent = percent;
                setExportJob(jobId, { progress: percent });
                send({ type: 'progress', percent, currentSec: currentSeconds.toFixed(1), totalSec: duration.toFixed(1) });
              }
            }
          });

          // Task 1: Keep the FULL stderr (cap at 200 KB)
          currentChild.stderr.on('data', (chunk: Buffer) => {
            const str = chunk.toString();
            if (stderrData.length + str.length <= 200 * 1024) {
              stderrData += str;
            } else if (stderrData.length < 200 * 1024) {
              stderrData += str.slice(0, 200 * 1024 - stderrData.length);
            }
          });

          currentChild.on('error', (error: any) => {
            if (processSettled) return;
            processSettled = true;
            const message = `FFmpeg failed to start: ${error.message}`;
            setExportJob(jobId, { status: 'failed', error: message });
            send({ type: 'error', error: message });
            cleanup();
            close();
          });

          currentChild.on('close', async (exitCode: number | null) => {
            if (processSettled) return;
            processSettled = true;

            if (exitCode !== 0) {
              // Task 1: Head 2000 + Tail 2000, console.error binary, version, full args, head, tail, and write log
              const head = stderrData.slice(0, 2000);
              const tail = stderrData.slice(-2000);
              let versionFirstLine = '';
              try {
                versionFirstLine = runCapture(ffmpegPath, ['-version'], 5000).split(/\r?\n/)[0] || '';
              } catch {}

              console.error(`[FFmpeg Export Error] jobId: ${jobId}, attempt: ${attempt}, exitCode: ${exitCode}`);
              console.error(`FFmpeg binary path: ${ffmpegPath}`);
              console.error(`FFmpeg version: ${versionFirstLine}`);
              console.error(`FFmpeg args: ${currentArgs.join(' ')}`);
              console.error(`FFmpeg stderr HEAD:\n${head}`);
              console.error(`FFmpeg stderr TAIL:\n${tail}`);

              const tempLogDir = fs.existsSync('/tmp') ? '/tmp' : os.tmpdir();
              const logPath = path.join(tempLogDir, `export_${jobId}.log`);
              const appLogPath = path.join(process.cwd(), 'export_last_error.log');
              try {
                fs.writeFileSync(logPath, stderrData, 'utf8');
                fs.writeFileSync(appLogPath, stderrData, 'utf8');
                console.error(`Wrote full stderr to ${logPath} and ${appLogPath}`);
              } catch (logErr) {
                console.error(`Failed to write stderr log:`, logErr);
              }

              // Task 4: Retry ladder if exit code != 0 and output file is empty/invalid
              let isOutputEmpty = true;
              try {
                if (fs.existsSync(outputPath)) {
                  const stat = fs.statSync(outputPath);
                  // A failed MP4 file before frame write is either 0 bytes or has a ~48 byte container header
                  isOutputEmpty = stat.size < 1024;
                }
              } catch {}

              if (isOutputEmpty && attempt < maxAttempts) {
                try {
                  if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                } catch {}
                const nextAttempt = attempt + 1;
                currentAttempt = nextAttempt;
                send({ type: 'retry', attempt: nextAttempt });
                await startProcess(nextAttempt);
                return;
              }

              const diagnostic = tail.trim() || head.trim();
              const message = `FFmpeg exited with code ${exitCode}.\n${diagnostic || 'No FFmpeg diagnostic output was captured.'}`;
              setExportJob(jobId, { status: 'failed', error: message });
              send({ type: 'error', error: message });
              cleanup();
              close();
              return;
            }

            try {
              send({ type: 'progress', percent: 98, status: 'Validating exported video...' });

              const validation = await validateExportedVideo(
                ffmpegPath,
                ffprobePath,
                outputPath,
                inputPath,
              );

              if (!validation.valid) {
                throw new Error(`Export validation failed: ${validation.errors.join('; ')}`);
              }

              keepOutput = true;
              const downloadUrl = `/api/export?file=${encodeURIComponent(fileName)}`;
              setExportJob(jobId, {
                status: 'completed',
                progress: 100,
                downloadUrl,
                fileName,
                warnings: validation.warnings,
              });

              send({
                type: 'complete',
                attempt,
                percent: 100,
                downloadUrl,
                fileName,
                validation: {
                  codec: validation.videoCodec,
                  pixFmt: validation.pixFmt,
                  isCfr: validation.isCfr,
                  audioCodec: validation.audioCodec,
                },
                warnings: validation.warnings,
              });
            } catch (error: any) {
              const message = error?.message || 'Video export validation failed.';
              setExportJob(jobId, { status: 'failed', error: message });
              send({ type: 'error', error: message });
            } finally {
              cleanup();
              close();
            }
          });
        };

        startProcess(1);

        function cleanup() {
          try { if (assPath && fs.existsSync(assPath)) fs.unlinkSync(assPath); } catch {}
          try {
            if (inputIsTemporary && inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
          } catch {}
          try {
            if (!keepOutput && outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          } catch {}
        }
      },
      cancel() {
        // The client closing its connection does not kill the export process.
        // The export may continue; the job can still be queried by jobId.
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: any) {
    const message = error?.message || 'Export failed.';
    console.error(`[Bgern export ${jobId}]`, error);

    setExportJob(jobId, { status: 'failed', error: message });

    try { if (assPath && fs.existsSync(assPath)) fs.unlinkSync(assPath); } catch {}
    try {
      if (inputIsTemporary && inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    } catch {}
    try {
      if (!keepOutput && outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch {}

    return NextResponse.json(
      { success: false, jobId, error: message },
      { status: 400 },
    );
  }
}
