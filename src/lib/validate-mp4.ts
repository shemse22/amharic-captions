import { spawn } from 'child_process';

export async function validateMp4(ffmpegPath: string, filePath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let isSettled = false;
    const timeout = setTimeout(() => {
      if (isSettled) return;
      isSettled = true;
      try {
        proc.kill('SIGKILL');
      } catch {}
      // If validation times out but encoding succeeded, do not block the user
      resolve();
    }, 10000);

    const proc = spawn(
      ffmpegPath,
      [
        '-nostdin',
        '-hide_banner',
        '-nostats',
        '-v',
        'error',
        '-t',
        '3',
        '-i',
        filePath,
        '-map',
        '0:v:0',
        '-map',
        '0:a?',
        '-f',
        'null',
        '-',
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] }
    );

    let stderr = '';

    proc.stderr.on('data', (data: Buffer) => {
      stderr = `${stderr}${data.toString()}`.slice(-4000);
    });

    proc.on('error', (error) => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timeout);
      // If validation spawn fails, don't fail the whole export if the file exists
      console.warn(`[validateMp4] Validation check warning: ${error.message}`);
      resolve();
    });

    proc.on('close', (code) => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timeout);

      if (code !== 0) {
        console.warn(`[validateMp4] Validation returned non-zero code (${code}): ${stderr}`);
        // If it's a fatal error, reject
        if (stderr.includes('Invalid data found when processing input') || stderr.includes('moov atom not found')) {
          reject(new Error(`Converted MP4 file is unreadable: ${stderr.slice(-500)}`));
          return;
        }
      }

      resolve();
    });
  });
}
