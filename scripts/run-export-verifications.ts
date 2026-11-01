import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { NextRequest } from 'next/server';
import { POST } from '../src/app/api/export/route';
import { verifyExport } from './verify-export';

const ffmpegPath = ffmpegInstaller?.path || 'ffmpeg';

async function main() {
  const sampleSource = path.join(process.cwd(), 'public', 'uploads', '1792411899934_snaptik_7641284393889254689_v3.mp4');
  const tempDir = path.join(process.cwd(), 'public', 'uploads', '.temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Create a 5-second clean clip from the source video to test all 3 exports
  const testInputPath = path.join(tempDir, 'benchmark_source_5s.mp4');
  console.log(`🎬 Preparing 5s source clip from: ${path.basename(sampleSource)}`);
  const trimRes = spawnSync(
    ffmpegPath,
    [
      '-y',
      '-hide_banner',
      '-loglevel', 'error',
      '-ss', '0',
      '-i', sampleSource,
      '-t', '5',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-c:a', 'aac',
      testInputPath,
    ],
    { encoding: 'utf8' }
  );

  if (trimRes.status !== 0) {
    console.error('Failed to create benchmark clip:', trimRes.stderr);
    process.exit(1);
  }

  const sourceBuffer = fs.readFileSync(testInputPath);
  const qualities: Array<'original' | '720p' | '1080p'> = ['original', '720p', '1080p'];
  const results: any[] = [];

  for (const quality of qualities) {
    console.log(`\n======================================================================`);
    console.log(`🚀 EXPORTING TARGET QUALITY: ${quality.toUpperCase()}`);
    console.log(`======================================================================`);

    const formData = new FormData();
    formData.append('video', new Blob([sourceBuffer], { type: 'video/mp4' }), 'sample.mp4');
    formData.append('quality', quality);
    formData.append(
      'segments',
      JSON.stringify([
        { start: 0.5, end: 2.5, text: 'ሰላም እንደምን አላችሁ' },
        { start: 2.6, end: 4.8, text: 'ብገርን የአማርኛ የቪዲዮ ካፕሽን' },
      ])
    );
    formData.append(
      'style',
      JSON.stringify({
        fontFamily: 'Noto Sans Ethiopic',
        fontSize: 32,
        fontColor: '#FFFFFF',
        highlightColor: '#13FD00',
        strokeColor: '#000000',
        strokeWeight: 'Medium',
      })
    );

    const req = new NextRequest('http://localhost:3000/api/export', {
      method: 'POST',
      body: formData,
      headers: { Accept: 'text/event-stream' },
    });

    const response = await POST(req);
    if (!response.ok) {
      console.error(`Export request failed (${response.status}) for ${quality}`);
      process.exit(1);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      console.error('No response stream received');
      process.exit(1);
    }

    const decoder = new TextDecoder();
    let streamBuffer = '';
    let exportedFileName = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      streamBuffer += decoder.decode(value, { stream: true });
      const lines = streamBuffer.split('\n');
      streamBuffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const evt = JSON.parse(line.slice(6));
          if (evt.type === 'progress') {
            process.stdout.write(`\rEncoding progress [${quality}]: ${evt.percent}%`);
          } else if (evt.type === 'complete') {
            exportedFileName = evt.fileName;
            process.stdout.write(`\rEncoding progress [${quality}]: 100% (Complete)\n`);
          } else if (evt.type === 'error') {
            console.error(`\nExport failed: ${evt.error}`);
            process.exit(1);
          }
        } catch {}
      }
    }

    const exportedPath = path.join(process.cwd(), 'public', 'uploads', exportedFileName);
    console.log(`\nSaved export to: ${exportedPath}`);

    // Verify the exported MP4 using verifyExport
    const verification = verifyExport(exportedPath);
    results.push({ quality, verification, exportedPath });

    if (!verification.success) {
      console.error(`❌ Verification failed for ${quality}!`);
      process.exit(1);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('🎉 ALL EXPORTS VERIFIED SUCCESSFULLY:');
  for (const r of results) {
    const v = r.verification;
    console.log(
      `• [${r.quality.toUpperCase().padEnd(8)}] Resolution: ${v.resolution.padEnd(10)} | Codec: ${v.codec} | Profile: ${v.profile.padEnd(5)} | Level: ${String(v.level).padEnd(3)} | CFR: ${v.rFrameRate} | Status: PASSED`
    );
  }
  console.log('='.repeat(70) + '\n');
}

main().catch((err) => {
  console.error('Benchmark execution error:', err);
  process.exit(1);
});
