import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

function getFfmpegPath(): string {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }
  if (ffmpegInstaller && ffmpegInstaller.path && fs.existsSync(ffmpegInstaller.path)) {
    return ffmpegInstaller.path;
  }
  return process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
}

function getFfprobePath(): string {
  if (process.env.FFPROBE_PATH && fs.existsSync(process.env.FFPROBE_PATH)) {
    return process.env.FFPROBE_PATH;
  }
  if (ffprobeInstaller && (ffprobeInstaller as any).path && fs.existsSync((ffprobeInstaller as any).path)) {
    return (ffprobeInstaller as any).path;
  }
  return process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe';
}

function parseRate(val?: string): number {
  if (!val || val === '0/0' || val === 'N/A') return 0;
  const [num, den] = val.split('/').map(Number);
  return den ? num / den : Number(val) || 0;
}

export interface VerificationResult {
  filePath: string;
  success: boolean;
  codec?: string;
  profile?: string;
  level?: string | number;
  resolution?: string;
  pixFmt?: string;
  rFrameRate?: string;
  avgFrameRate?: string;
  isCfr?: boolean;
  videoDuration?: number;
  audioDuration?: number;
  durationDiff?: number;
  maxPacketGap?: number;
  freezes: Array<{ start: number; duration: number; end: number }>;
  errors: string[];
}

export function verifyExport(filePath: string): VerificationResult {
  const errors: string[] = [];
  const ffmpegPath = getFfmpegPath();
  const ffprobePath = getFfprobePath();

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found at path: "${filePath}"`);
    process.exit(1);
  }

  // 1. Run ffprobe for stream & container metadata
  const probeProc = spawnSync(
    ffprobePath,
    ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', filePath],
    { encoding: 'utf8' }
  );

  if (probeProc.status !== 0) {
    console.error(`❌ ffprobe execution failed: ${probeProc.stderr}`);
    process.exit(1);
  }

  let probeData: any = {};
  try {
    probeData = JSON.parse(probeProc.stdout);
  } catch (err: any) {
    console.error(`❌ Failed to parse ffprobe JSON output: ${err.message}`);
    process.exit(1);
  }

  const streams: any[] = probeData.streams || [];
  const videoStream = streams.find((s) => s.codec_type === 'video');
  const audioStream = streams.find((s) => s.codec_type === 'audio');

  if (!videoStream) {
    console.error('❌ Error: No video stream detected in output file.');
    process.exit(1);
  }

  const codec = videoStream.codec_name || 'unknown';
  const profile = videoStream.profile || 'unknown';
  const level = videoStream.level !== undefined ? videoStream.level : 'unknown';
  const width = videoStream.width || 0;
  const height = videoStream.height || 0;
  const resolution = `${width}x${height}`;
  const pixFmt = videoStream.pix_fmt || 'unknown';
  const rFrameRate = videoStream.r_frame_rate || '0/0';
  const avgFrameRate = videoStream.avg_frame_rate || '0/0';

  const rFps = parseRate(rFrameRate);
  const avgFps = parseRate(avgFrameRate);
  const isCfr = Math.abs(rFps - avgFps) < 0.05 && rFps > 0;

  console.log('='.repeat(70));
  console.log(`🔍 VERIFYING EXPORT: ${path.basename(filePath)}`);
  console.log('='.repeat(70));
  console.log(`• Codec:          ${codec}`);
  console.log(`• Profile:        ${profile}`);
  console.log(`• Level:          ${level}`);
  console.log(`• Resolution:     ${resolution}`);
  console.log(`• Pixel Format:   ${pixFmt}`);
  console.log(`• r_frame_rate:   ${rFrameRate} (${rFps.toFixed(3)} fps)`);
  console.log(`• avg_frame_rate: ${avgFrameRate} (${avgFps.toFixed(3)} fps)`);
  console.log(`• Frame Rate:     ${isCfr ? 'CONSTANT (CFR)' : 'VARIABLE (VFR)'}`);

  // 2. Validate constant frame rate
  if (!isCfr) {
    errors.push(
      `Frame rate is not constant (r_frame_rate: ${rFrameRate} [${rFps}], avg_frame_rate: ${avgFrameRate} [${avgFps}])`
    );
  }

  // Validate pixel format is yuv420p
  if (pixFmt.toLowerCase() !== 'yuv420p') {
    errors.push(`Pixel format is "${pixFmt}", expected "yuv420p".`);
  }

  // Validate A/V duration difference < 0.1 s
  const videoDuration = parseFloat(videoStream.duration || probeData.format?.duration || '0');
  let audioDuration: number | undefined;
  let durationDiff: number | undefined;

  if (audioStream) {
    audioDuration = parseFloat(audioStream.duration || probeData.format?.duration || '0');
    durationDiff = Math.abs(videoDuration - audioDuration);
    console.log(`• Video Duration: ${videoDuration.toFixed(3)} s`);
    console.log(`• Audio Duration: ${audioDuration.toFixed(3)} s`);
    console.log(`• A/V Diff:       ${durationDiff.toFixed(3)} s`);

    if (durationDiff > 0.1) {
      errors.push(
        `A/V duration difference (${durationDiff.toFixed(3)} s) exceeds tolerance of 0.1 s (video: ${videoDuration.toFixed(3)} s, audio: ${audioDuration.toFixed(3)} s).`
      );
    }
  } else {
    console.log(`• Video Duration: ${videoDuration.toFixed(3)} s (no audio stream)`);
  }

  // 3. Run ffmpeg freezedetect (n=0.003, d=1)
  console.log('• Running freezedetect (n=0.003, d=1)...');
  const freezeProc = spawnSync(
    ffmpegPath,
    [
      '-nostdin',
      '-hide_banner',
      '-i', filePath,
      '-vf', 'freezedetect=n=0.003:d=1',
      '-map', '0:v:0',
      '-f', 'null',
      '-',
    ],
    { encoding: 'utf8' }
  );

  const freezeStderr = freezeProc.stderr || '';
  const freezes: Array<{ start: number; duration: number; end: number }> = [];
  let currentStart: number | null = null;
  let currentDur: number | null = null;

  for (const line of freezeStderr.split(/\r?\n/)) {
    const startMatch = line.match(/freeze_start:\s*([0-9.]+)/);
    if (startMatch) currentStart = parseFloat(startMatch[1]);

    const durMatch = line.match(/freeze_duration:\s*([0-9.]+)/);
    if (durMatch) currentDur = parseFloat(durMatch[1]);

    const endMatch = line.match(/freeze_end:\s*([0-9.]+)/);
    if (endMatch && currentStart !== null) {
      const end = parseFloat(endMatch[1]);
      const duration = currentDur !== null ? currentDur : end - currentStart;
      if (duration >= 1.0) {
        freezes.push({ start: currentStart, duration, end });
      }
      currentStart = null;
      currentDur = null;
    }
  }

  if (freezes.length > 0) {
    for (const f of freezes) {
      errors.push(`Detected video freeze of ${f.duration.toFixed(2)} s from ${f.start.toFixed(2)} s to ${f.end.toFixed(2)} s.`);
    }
    console.log(`• Freezes >= 1s:  DETECTED (${freezes.length} freeze(s))`);
  } else {
    console.log('• Freezes >= 1s:  None detected (Clean)');
  }

  // 4. Check packet-to-packet gaps in video stream <= 0.1 s
  console.log('• Checking packet-to-packet timestamps...');
  const packetProc = spawnSync(
    ffprobePath,
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'packet=pts_time,dts_time', '-of', 'csv=p=0', filePath],
    { encoding: 'utf8' }
  );

  let maxPacketGap = 0;
  let maxGapAt = 0;
  const timestamps: number[] = [];

  for (const line of (packetProc.stdout || '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const [ptsStr, dtsStr] = line.split(',');
    const pts = parseFloat(ptsStr);
    const dts = parseFloat(dtsStr);
    const t = !isNaN(pts) ? pts : !isNaN(dts) ? dts : NaN;
    if (!isNaN(t)) {
      timestamps.push(t);
    }
  }

  timestamps.sort((a, b) => a - b);
  for (let i = 1; i < timestamps.length; i++) {
    const gap = timestamps[i] - timestamps[i - 1];
    if (gap > maxPacketGap) {
      maxPacketGap = gap;
      maxGapAt = timestamps[i - 1];
    }
  }

  console.log(`• Packets scanned: ${timestamps.length}`);
  console.log(`• Max Packet Gap:  ${maxPacketGap.toFixed(4)} s (at ${maxGapAt.toFixed(3)} s)`);

  if (maxPacketGap > 0.1) {
    errors.push(
      `Packet-to-packet gap of ${maxPacketGap.toFixed(4)} s at timestamp ${maxGapAt.toFixed(3)} s exceeds 0.1 s limit.`
    );
  }

  console.log('-'.repeat(70));
  if (errors.length > 0) {
    console.error(`❌ VERIFICATION FAILED with ${errors.length} error(s):`);
    for (const err of errors) {
      console.error(`   - ${err}`);
    }
    console.log('='.repeat(70) + '\n');
    return {
      filePath,
      success: false,
      codec,
      profile,
      level,
      resolution,
      pixFmt,
      rFrameRate,
      avgFrameRate,
      isCfr,
      videoDuration,
      audioDuration,
      durationDiff,
      maxPacketGap,
      freezes,
      errors,
    };
  }

  console.log('✅ ALL VERIFICATION CHECKS PASSED:');
  console.log('   ✔ Constant frame rate confirmed');
  console.log('   ✔ Pixel format is yuv420p');
  console.log('   ✔ Audio & Video durations synchronized (< 0.1 s)');
  console.log('   ✔ No freezes >= 1.0 s');
  console.log('   ✔ No packet gaps > 0.1 s');
  console.log('='.repeat(70) + '\n');

  return {
    filePath,
    success: true,
    codec,
    profile,
    level,
    resolution,
    pixFmt,
    rFrameRate,
    avgFrameRate,
    isCfr,
    videoDuration,
    audioDuration,
    durationDiff,
    maxPacketGap,
    freezes,
    errors: [],
  };
}

// CLI entry point
if (require.main === module || process.argv[1]?.endsWith('verify-export.ts')) {
  const targetFile = process.argv[2];
  if (!targetFile) {
    console.error('Usage: npx tsx scripts/verify-export.ts <path-to-exported-mp4>');
    process.exit(1);
  }

  const result = verifyExport(targetFile);
  if (!result.success) {
    process.exit(1);
  }
}
