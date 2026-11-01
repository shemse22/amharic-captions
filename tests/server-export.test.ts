import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { NextRequest } from 'next/server';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import { POST, GET } from '../src/app/api/export/route';
import { probeMedia } from '../src/lib/video-validation';

const ffmpegPath = ffmpegInstaller?.path || 'ffmpeg';
const ffprobePath = ffprobeInstaller?.path || 'ffprobe';

async function createTestVideo(filePath: string) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  const args = [
    '-y',
    '-hide_banner',
    '-loglevel', 'error',
    '-f', 'lavfi',
    '-i', 'testsrc2=size=1280x720:rate=30:duration=3',
    '-f', 'lavfi',
    '-i', 'sine=frequency=440:sample_rate=44100:duration=3',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-ar', '44100',
    '-ac', '2',
    '-shortest',
    filePath,
  ];

  const res = spawnSync(ffmpegPath, args, { encoding: 'utf8' });
  assert.equal(res.status, 0, `Failed to generate test video: ${res.stderr}`);
}

test('POST /api/export generates deterministic CFR video with burned Amharic ASS subtitles', async () => {
  const tmpDir = path.join(process.cwd(), 'public', 'uploads', '.temp');
  await fs.mkdir(tmpDir, { recursive: true });
  const testInput = path.join(tmpDir, `test_src_${Date.now()}.mp4`);
  await createTestVideo(testInput);

  const fileBuffer = await fs.readFile(testInput);
  const formData = new FormData();
  formData.append('video', new Blob([fileBuffer], { type: 'video/mp4' }), 'input.mp4');
  formData.append('quality', '720p');
  formData.append(
    'segments',
    JSON.stringify([
      { start: 0, end: 1.5, text: 'ሰላም ለሁላችሁ' },
      { start: 1.5, end: 3, text: 'ብገርን AI ቪዲዮ' },
    ])
  );
  formData.append(
    'style',
    JSON.stringify({
      fontFamily: 'Noto Sans Ethiopic',
      fontSize: 28,
      fontColor: '#FFFFFF',
      highlightColor: '#FFFF00',
    })
  );

  const req = new NextRequest('http://localhost:3000/api/export', {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'text/event-stream',
    },
  });

  const response = await POST(req);
  assert.equal(response.status, 200);

  const reader = response.body?.getReader();
  assert.ok(reader, 'Response should provide a ReadableStream body');

  const decoder = new TextDecoder();
  let buffer = '';
  let completeEvent: any = null;
  let hasProgress = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const payload = JSON.parse(line.slice(6));
        if (payload.type === 'progress') {
          hasProgress = true;
        } else if (payload.type === 'complete') {
          completeEvent = payload;
        } else if (payload.type === 'error') {
          throw new Error(`Export stream reported error: ${payload.error}`);
        }
      }
    }
  }

  assert.ok(completeEvent, 'Export must emit a complete event');
  assert.equal(completeEvent.percent, 100);
  assert.equal(completeEvent.validation?.codec, 'h264');
  assert.equal(completeEvent.validation?.pixFmt, 'yuv420p');
  assert.equal(completeEvent.validation?.isCfr, true);
  assert.equal(completeEvent.validation?.audioCodec, 'aac');

  // Verify download endpoint
  const dlReq = new NextRequest(`http://localhost:3000/api/export?file=${encodeURIComponent(completeEvent.fileName)}`);
  const dlRes = await GET(dlReq);
  assert.equal(dlRes.status, 200);
  assert.ok(dlRes.headers.get('content-disposition')?.includes('attachment'));
  assert.equal(dlRes.headers.get('content-type'), 'video/mp4');

  // Clean up
  try { await fs.unlink(testInput); } catch {}
  const exportedPath = path.join(process.cwd(), 'public', 'uploads', completeEvent.fileName);
  try { await fs.unlink(exportedPath); } catch {}
});
