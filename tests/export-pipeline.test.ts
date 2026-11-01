import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { NextRequest } from 'next/server';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import { POST } from '../src/app/api/repair-video/route';

const ffmpegPath = ffmpegInstaller?.path || 'ffmpeg';
const ffprobePath = ffprobeInstaller?.path || 'ffprobe';

function runCli(executable: string, args: string[]) {
  return spawnSync(executable, args, { encoding: 'utf8' });
}

function parseRate(value: string | undefined): number | null {
  if (!value || value === 'N/A') return null;
  const [numerator, denominator] = value.split('/').map(Number);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
  return numerator / denominator;
}

async function generateInput(filePath: string, variant: 'cfr' | 'vfr') {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const args = [
    '-y',
    '-hide_banner',
    '-loglevel', 'error',
    '-f', 'lavfi',
    '-i', 'testsrc2=size=1280x720:rate=30:duration=10',
    '-f', 'lavfi',
    '-i', 'sine=frequency=440:sample_rate=48000:duration=10',
    '-filter_complex',
    variant === 'vfr'
      ? '[0:v]fps=30,setsar=1,format=yuv420p,trim=duration=10,setpts=PTS*1.0+sin(PI*T/5)*0.02[v0];[1:a]aresample=async=1000:first_pts=0[a0]'
      : '[0:v]fps=30,setsar=1,format=yuv420p[v0];[1:a]aresample=async=1000:first_pts=0[a0]',
    '-map', '[v0]',
    '-map', '[a0]',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '21',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-ar', '48000',
    '-ac', '2',
    '-movflags', '+faststart',
    filePath,
  ];

  const result = runCli(ffmpegPath, args);
  assert.equal(result.status, 0, `ffmpeg generation failed for ${variant}: ${result.stderr || result.stdout}`);
}

async function inspectVideo(filePath: string) {
  const probe = runCli(ffprobePath, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', filePath]);
  assert.equal(probe.status, 0, `ffprobe failed for ${filePath}: ${probe.stderr}`);
  const data = JSON.parse(probe.stdout) as {
    streams?: Array<{
      codec_type?: string;
      codec_name?: string;
      pix_fmt?: string;
      r_frame_rate?: string;
      avg_frame_rate?: string;
      time_base?: string;
      start_time?: string;
      duration?: string;
      nb_frames?: string;
      sample_rate?: string;
      channels?: number;
      bit_rate?: string;
      profile?: string;
      level?: number;
    }>;
    format?: { duration?: string; bit_rate?: string; size?: string; format_name?: string };
  };

  const video = data.streams?.find((stream) => stream.codec_type === 'video');
  const audio = data.streams?.find((stream) => stream.codec_type === 'audio');
  const packetResult = runCli(ffprobePath, ['-v', 'error', '-select_streams', 'v', '-show_entries', 'packet=pts_time,dts_time,flags', '-of', 'csv=p=0', filePath]);
  assert.equal(packetResult.status, 0, `ffprobe packet scan failed for ${filePath}: ${packetResult.stderr}`);

  const keyframes: number[] = [];
  const gaps: number[] = [];
  let previousPts: number | null = null;
  for (const line of packetResult.stdout.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const columns = line.split(',');
    const pts = Number(columns[0]?.trim());
    const dts = Number(columns[1]?.trim());
    const flags = columns.slice(2).join(',');
    const packetTime = Number.isFinite(pts) ? pts : dts;
    if (flags.includes('K') && Number.isFinite(packetTime)) {
      keyframes.push(packetTime);
    }
    if (Number.isFinite(packetTime)) {
      if (previousPts !== null) {
        const gap = packetTime - previousPts;
        if (gap > 0) gaps.push(gap);
      }
      previousPts = packetTime;
    }
  }
  const maxKeyframeGap = keyframes.length > 1
    ? Math.max(...keyframes.slice(1).map((timestamp, index) => timestamp - keyframes[index]))
    : 0;
  const keyframeIntervals = keyframes.length > 1 ? keyframes.slice(1).map((timestamp, index) => timestamp - keyframes[index]) : [];

  const fileBytes = await fs.readFile(filePath);
  const moovIndex = fileBytes.indexOf(Buffer.from('moov'));
  const mdatIndex = fileBytes.indexOf(Buffer.from('mdat'));

  return {
    video,
    audio,
    format: data.format,
    constantFrameRate: !!video && !!video.r_frame_rate && !!video.avg_frame_rate
      ? Math.abs((parseRate(video.r_frame_rate) ?? 0) - (parseRate(video.avg_frame_rate) ?? 0)) < 0.05
      : false,
    avDurationDiff: !!video && !!audio ? Math.abs((Number(video.duration) ?? 0) - (Number(audio.duration) ?? 0)) : Infinity,
    startsAtZero: !!video && !!audio
      ? Math.abs(Number(video.start_time ?? 0)) < 0.1 && Math.abs(Number(audio.start_time ?? 0)) < 0.1
      : false,
    maxKeyframeInterval: maxKeyframeGap,
    keyframeIntervals,
    pixFmt: video?.pix_fmt,
    hasFastStart: moovIndex >= 0 && mdatIndex >= 0 ? moovIndex < mdatIndex : false,
    largestGap: gaps.length ? Math.max(...gaps) : 0,
  };
}

async function makeRouteRequest(filePath: string, label: string) {
  const buffer = await fs.readFile(filePath);
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'video/mp4' }), `${label}.mp4`);
  form.append('filename', `${label}.mp4`);
  form.append('resolution', '720p');
  form.append('duration', '10');
  form.append('normalizeExport', 'true');
  form.append('recordedBytes', String(buffer.length));
  const response = await POST(new NextRequest('http://localhost/api/repair-video', { method: 'POST', body: form }));
  const status = response.status;
  const body = Buffer.from(await response.arrayBuffer());
  if (status !== 200) {
    let json: any = null;
    try { json = JSON.parse(body.toString('utf8')); } catch {}
    assert.equal(status, 200, `${label}: export route failed (${response.status}): ${json?.error?.tail?.join('\n') || body.toString('utf8').slice(0, 400)}`);
  }
  return { response, body };
}

test('export pipeline keeps output MP4 healthy for CFR and VFR inputs', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'export-pipeline-'));
  const cases = [
    { label: 'cfr', file: path.join(tmpDir, 'input-cfr.mp4') },
    { label: 'vfr', file: path.join(tmpDir, 'input-vfr.mp4') },
  ];

  for (const item of cases) {
    await generateInput(item.file, item.label === 'vfr' ? 'vfr' : 'cfr');
  }

  for (const item of cases) {
    const { body } = await makeRouteRequest(item.file, item.label);
    const outputPath = path.join(tmpDir, `${item.label}-export.mp4`);
    await fs.writeFile(outputPath, body);
    const info = await inspectVideo(outputPath);

    assert.ok(info.constantFrameRate, `${item.label}: failed CFR check (r_frame_rate and avg_frame_rate differ by ${Math.abs((parseRate(info.video?.r_frame_rate) ?? 0) - (parseRate(info.video?.avg_frame_rate) ?? 0))})`);
    assert.ok(info.avDurationDiff < 0.1, `${item.label}: failed A/V duration check (${info.avDurationDiff}s difference)`);
    assert.ok(info.startsAtZero, `${item.label}: failed start_time check (video=${info.video?.start_time ?? 'n/a'}, audio=${info.audio?.start_time ?? 'n/a'})`);
    assert.ok(info.maxKeyframeInterval <= 2 + 0.01, `${item.label}: failed keyframe interval check (max=${info.maxKeyframeInterval}s, intervals=${JSON.stringify(info.keyframeIntervals)})`);
    assert.equal(info.pixFmt, 'yuv420p', `${item.label}: failed pix_fmt check (${info.pixFmt ?? 'n/a'})`);
    assert.ok(info.hasFastStart, `${item.label}: failed faststart check (moov after mdat or missing)`);
  }
});
