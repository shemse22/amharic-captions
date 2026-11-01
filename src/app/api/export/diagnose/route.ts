import { NextRequest, NextResponse } from 'next/server';
import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

function getFfmpegInfo() {
  const configured = process.env.FFMPEG_PATH;
  if (configured && fs.existsSync(configured) && executableWorks(configured)) {
    return { path: configured, source: 'FFMPEG_PATH', works: true };
  }
  if (executableWorks('ffmpeg')) {
    return { path: 'ffmpeg', source: 'PATH', works: true };
  }
  const bundled = ffmpegInstaller?.path;
  if (bundled && fs.existsSync(bundled) && executableWorks(bundled)) {
    return { path: bundled, source: '@ffmpeg-installer', works: true };
  }
  return { path: bundled || configured || 'ffmpeg', source: 'none', works: false };
}

function getFfprobeInfo() {
  const configured = process.env.FFPROBE_PATH;
  if (configured && fs.existsSync(configured) && executableWorks(configured)) {
    return { path: configured, source: 'FFPROBE_PATH', works: true };
  }
  if (executableWorks('ffprobe')) {
    return { path: 'ffprobe', source: 'PATH', works: true };
  }
  const bundled = (ffprobeInstaller as any)?.path;
  if (bundled && fs.existsSync(bundled) && executableWorks(bundled)) {
    return { path: bundled, source: '@ffprobe-installer', works: true };
  }
  return { path: bundled || configured || 'ffprobe', source: 'none', works: false };
}

function runCapture(executable: string, args: string[], timeout = 10_000): string {
  try {
    const result = spawnSync(executable, args, {
      encoding: 'utf8',
      timeout,
      maxBuffer: 2 * 1024 * 1024,
    });
    return `${result.stdout || ''}${result.stderr || ''}`;
  } catch (e: any) {
    return `Error: ${e?.message || e}`;
  }
}

function runTestEncode(ffmpegPath: string, extraArgs: string[]): { exitCode: number | null; stderrTail: string } {
  const args = [
    '-nostdin',
    '-hide_banner',
    '-y',
    '-f', 'lavfi',
    '-i', 'testsrc=s=640x360:d=2',
    '-c:v', 'libx264',
    ...extraArgs,
    '-f', 'null',
    '-',
  ];
  try {
    const result = spawnSync(ffmpegPath, args, {
      encoding: 'utf8',
      timeout: 15_000,
      maxBuffer: 2 * 1024 * 1024,
    });
    const stderr = result.stderr || result.stdout || '';
    return {
      exitCode: result.status,
      stderrTail: stderr.slice(-500),
    };
  } catch (e: any) {
    return {
      exitCode: -1,
      stderrTail: `Spawn error: ${e?.message || e}`.slice(-500),
    };
  }
}

export async function GET(req: NextRequest) {
  const adminTokenEnv = process.env.ADMIN_TOKEN;
  if (!adminTokenEnv) {
    return NextResponse.json({ error: 'ADMIN_TOKEN is not configured on server' }, { status: 403 });
  }

  const url = new URL(req.url);
  const authHeader = req.headers.get('authorization') || '';
  const tokenHeader = req.headers.get('x-admin-token') || '';
  const queryToken = url.searchParams.get('token') || url.searchParams.get('admin_token') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim() || tokenHeader.trim() || queryToken.trim();

  if (token !== adminTokenEnv) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (url.searchParams.has('log')) {
    const appLog = path.join(process.cwd(), 'export_last_error.log');
    if (fs.existsSync(appLog)) {
      const content = fs.readFileSync(appLog, 'utf8');
      return new Response(content, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
    const tempDir = fs.existsSync('/tmp') ? '/tmp' : os.tmpdir();
    try {
      const files = fs.readdirSync(tempDir)
        .filter((f) => f.startsWith('export_') && f.endsWith('.log'))
        .map((f) => path.join(tempDir, f))
        .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
      if (files.length > 0) {
        const content = fs.readFileSync(files[0], 'utf8');
        return new Response(content, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    } catch {}
    return new Response('No export error log found on server yet.', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  const ffmpegInfo = getFfmpegInfo();
  const ffprobeInfo = getFfprobeInfo();

  const ffmpegVersion = runCapture(ffmpegInfo.path, ['-version'], 5000);
  const encodersRaw = runCapture(ffmpegInfo.path, ['-hide_banner', '-encoders'], 5000);
  const encoders264 = encodersRaw
    .split(/\r?\n/)
    .filter((l) => /264/i.test(l))
    .join('\n');

  let systemLimits = '';
  try {
    const shRes = spawnSync('sh', ['-c', 'ulimit -a; nproc; free -m'], {
      encoding: 'utf8',
      timeout: 5000,
      maxBuffer: 2 * 1024 * 1024,
    });
    systemLimits = `${shRes.stdout || ''}${shRes.stderr || ''}`.trim() || `Exit code ${shRes.status}`;
  } catch (e: any) {
    systemLimits = `sh command failed: ${e?.message || e}`;
  }

  const testA = runTestEncode(ffmpegInfo.path, []);
  const testB = runTestEncode(ffmpegInfo.path, ['-threads', '1', '-preset', 'ultrafast']);
  const testC = runTestEncode(ffmpegInfo.path, [
    '-threads', '1',
    '-preset', 'ultrafast',
    '-x264-params', 'threads=1:lookahead-threads=0:sliced-threads=0',
  ]);

  return NextResponse.json({
    binaries: {
      ffmpeg: ffmpegInfo,
      ffprobe: ffprobeInfo,
    },
    ffmpegVersion,
    encoders264,
    systemLimits,
    testEncodes: {
      defaultLibx264: testA,
      threads1Ultrafast: testB,
      x264ParamsThreads1: testC,
    },
  });
}
