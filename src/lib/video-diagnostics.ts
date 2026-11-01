import { spawn } from 'node:child_process';

interface ProbeStream {
  index?: number;
  codec_type?: string;
  codec_name?: string;
  profile?: string;
  level?: number;
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
}

interface ProbePacketSummary {
  packetCount: number;
  missingTimestampCount: number;
  nonMonotonicTimestampCount: number;
  largeGapCount: number;
  maxGapSeconds: number | null;
  keyframeCount: number;
  maxKeyframeIntervalSeconds: number | null;
  sparseKeyframes: boolean;
}

interface ProbeJson {
  streams?: ProbeStream[];
  format?: {
    duration?: string;
    size?: string;
    bit_rate?: string;
    format_name?: string;
  };
}

interface ProcessOutput {
  stdout: string;
  stderr: string;
  error?: string;
  exitCode: number | null;
}

export interface VideoDiagnostics {
  report: string;
  data: {
    input: ProbeJson | null;
    output: ProbeJson | null;
    inputPackets: ProbePacketSummary | null;
    outputPackets: ProbePacketSummary | null;
  };
}

function runProbe(executable: string, args: string[], maxOutputBytes = 64 * 1024 * 1024): Promise<ProcessOutput> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let outputBytes = 0;
    let didOverflow = false;
    let settled = false;
    let child: ReturnType<typeof spawn>;

    try {
      child = spawn(executable, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
      resolve({
        stdout: '',
        stderr: '',
        error: error instanceof Error ? error.message : 'Could not start ffprobe',
        exitCode: null,
      });
      return;
    }
    if (!child.stdout || !child.stderr) {
      child.kill();
      resolve({
        stdout,
        stderr,
        error: 'Could not capture ffprobe output',
        exitCode: null,
      });
      return;
    }

    const timeout = setTimeout(() => {
      child.kill();
      finish(null, 'ffprobe timed out');
    }, 60_000);

    const finish = (exitCode: number | null, error?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve({ stdout, stderr, error, exitCode });
    };

    child.stdout.on('data', (chunk: Buffer) => {
      outputBytes += chunk.length;
      if (outputBytes > maxOutputBytes) {
        didOverflow = true;
        child.kill();
        return;
      }
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => finish(null, error.message));
    child.on('close', (code) => {
      finish(code, didOverflow ? 'ffprobe output exceeded the diagnostics size limit' : undefined);
    });
  });
}

function finiteNumber(value: string | undefined): number | null {
  if (!value || value === 'N/A') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function frameRate(value: string | undefined): number | null {
  if (!value || value === 'N/A') return null;
  const [numerator, denominator] = value.split('/').map(Number);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
  return numerator / denominator;
}

function summarizePackets(csv: string): ProbePacketSummary {
  let packetCount = 0;
  let missingTimestampCount = 0;
  let nonMonotonicTimestampCount = 0;
  let largeGapCount = 0;
  let maxGapSeconds = 0;
  let keyframeCount = 0;
  let maxKeyframeIntervalSeconds = 0;
  let previousDts: number | null = null;
  const packetTimes: number[] = [];
  const keyframeTimes: number[] = [];
  const observedGaps: number[] = [];

  for (const line of csv.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const columns = line.split(',');
    const pts = finiteNumber(columns[0]?.trim());
    const dts = finiteNumber(columns[1]?.trim());
    const flags = columns.slice(2).join(',').trim();
    packetCount++;

    if (pts === null || dts === null) {
      missingTimestampCount++;
    }
    if (dts !== null && previousDts !== null && dts <= previousDts) {
      nonMonotonicTimestampCount++;
    }
    if (dts !== null) previousDts = dts;

    const packetTime = pts ?? dts;
    if (packetTime !== null) packetTimes.push(packetTime);
    if (flags.includes('K') && packetTime !== null) {
      keyframeCount++;
      keyframeTimes.push(packetTime);
    }
  }

  packetTimes.sort((a, b) => a - b);
  for (let index = 1; index < packetTimes.length; index++) {
    const gap = packetTimes[index] - packetTimes[index - 1];
    if (gap > 0) {
      observedGaps.push(gap);
      maxGapSeconds = Math.max(maxGapSeconds, gap);
    }
  }
  keyframeTimes.sort((a, b) => a - b);
  for (let index = 1; index < keyframeTimes.length; index++) {
    maxKeyframeIntervalSeconds = Math.max(
      maxKeyframeIntervalSeconds,
      keyframeTimes[index] - keyframeTimes[index - 1]
    );
  }

  const sortedGaps = [...observedGaps].sort((a, b) => a - b);
  const medianGap = sortedGaps.length
    ? sortedGaps[Math.floor(sortedGaps.length / 2)]
    : null;
  if (medianGap !== null) {
    largeGapCount = observedGaps.filter((gap) => gap > Math.max(0.5, medianGap * 5)).length;
  }

  return {
    packetCount,
    missingTimestampCount,
    nonMonotonicTimestampCount,
    largeGapCount,
    maxGapSeconds: maxGapSeconds || null,
    keyframeCount,
    maxKeyframeIntervalSeconds: maxKeyframeIntervalSeconds || null,
    sparseKeyframes: maxKeyframeIntervalSeconds > 2,
  };
}

async function probeFile(ffprobePath: string, filePath: string): Promise<ProbeJson | null> {
  const result = await runProbe(ffprobePath, [
    '-v', 'error',
    '-show_streams',
    '-show_format',
    '-of', 'json',
    filePath,
  ]);
  if (result.exitCode !== 0 || result.error) {
    console.warn(`[video-diagnostics] ffprobe failed for ${filePath}: ${result.error || result.stderr}`);
    return null;
  }

  try {
    return JSON.parse(result.stdout) as ProbeJson;
  } catch (error) {
    console.warn(`[video-diagnostics] Could not parse ffprobe output for ${filePath}:`, error);
    return null;
  }
}

async function probeVideoPackets(
  ffprobePath: string,
  filePath: string
): Promise<ProbePacketSummary | null> {
  const result = await runProbe(ffprobePath, [
    '-v', 'error',
    '-select_streams', 'v',
    '-show_entries', 'packet=pts_time,dts_time,flags',
    '-of', 'csv=p=0',
    filePath,
  ]);
  if (result.exitCode !== 0 || result.error) {
    console.warn(`[video-diagnostics] ffprobe packet scan failed for ${filePath}: ${result.error || result.stderr}`);
    return null;
  }
  return summarizePackets(result.stdout);
}

function formatSeconds(value: string | undefined): string {
  const seconds = finiteNumber(value);
  return seconds === null ? 'unavailable' : `${seconds.toFixed(3)}s`;
}

function formatRate(value: string | undefined): string {
  const rate = frameRate(value);
  return rate === null ? 'unavailable' : `${rate.toFixed(3)} fps (${value})`;
}

function describeFile(
  label: string,
  probe: ProbeJson | null,
  packets: ProbePacketSummary | null
): string[] {
  if (!probe) return [`${label}: ffprobe data unavailable`];

  const video = probe.streams?.find((stream) => stream.codec_type === 'video');
  const audio = probe.streams?.find((stream) => stream.codec_type === 'audio');
  const lines = [
    `${label}: container=${probe.format?.format_name || 'unknown'}, duration=${formatSeconds(probe.format?.duration)}, size=${probe.format?.size || 'unknown'} bytes, bitrate=${probe.format?.bit_rate || 'unknown'} bit/s`,
  ];

  if (video) {
    lines.push(
      `  Video: codec=${video.codec_name || 'unknown'}, profile=${video.profile || 'unknown'}, level=${video.level ?? 'unknown'}, pix_fmt=${video.pix_fmt || 'unknown'}, r_frame_rate=${formatRate(video.r_frame_rate)}, avg_frame_rate=${formatRate(video.avg_frame_rate)}, time_base=${video.time_base || 'unknown'}, start=${formatSeconds(video.start_time)}, duration=${formatSeconds(video.duration)}, frames=${video.nb_frames || 'unknown'}, bitrate=${video.bit_rate || 'unknown'} bit/s`
    );
  } else {
    lines.push('  Video: stream missing');
  }

  if (audio) {
    lines.push(
      `  Audio: codec=${audio.codec_name || 'unknown'}, sample_rate=${audio.sample_rate || 'unknown'} Hz, channels=${audio.channels ?? 'unknown'}, time_base=${audio.time_base || 'unknown'}, start=${formatSeconds(audio.start_time)}, duration=${formatSeconds(audio.duration)}, frames=${audio.nb_frames || 'unknown'}, bitrate=${audio.bit_rate || 'unknown'} bit/s`
    );
  } else {
    lines.push('  Audio: stream missing');
  }

  if (packets) {
    lines.push(
      `  Video packets: count=${packets.packetCount}, missing timestamps=${packets.missingTimestampCount}, non-monotonic timestamps=${packets.nonMonotonicTimestampCount}, large gaps=${packets.largeGapCount}, max gap=${packets.maxGapSeconds?.toFixed(3) || 'unavailable'}s, keyframes=${packets.keyframeCount}, max keyframe interval=${packets.maxKeyframeIntervalSeconds?.toFixed(3) || 'unavailable'}s`
    );
  }
  return lines;
}

function buildLikelyCauses(
  input: ProbeJson | null,
  output: ProbeJson | null,
  inputPackets: ProbePacketSummary | null,
  outputPackets: ProbePacketSummary | null,
  expectedDuration: number | null,
  outputSize: number
): string[] {
  const causes: string[] = [];
  const inputVideo = input?.streams?.find((stream) => stream.codec_type === 'video');
  const inputAudio = input?.streams?.find((stream) => stream.codec_type === 'audio');
  const outputVideo = output?.streams?.find((stream) => stream.codec_type === 'video');
  const outputAudio = output?.streams?.find((stream) => stream.codec_type === 'audio');
  const inputRate = frameRate(inputVideo?.r_frame_rate);
  const inputAverageRate = frameRate(inputVideo?.avg_frame_rate);
  const outputRate = frameRate(outputVideo?.r_frame_rate);
  const outputAverageRate = frameRate(outputVideo?.avg_frame_rate);
  const inputVideoStart = finiteNumber(inputVideo?.start_time);
  const inputAudioStart = finiteNumber(inputAudio?.start_time);
  const outputVideoStart = finiteNumber(outputVideo?.start_time);
  const outputAudioStart = finiteNumber(outputAudio?.start_time);
  const outputDuration = finiteNumber(output?.format?.duration);
  const inputDuration = finiteNumber(input?.format?.duration);
  const outputProbeUnavailable = outputSize > 0 && (!output || !outputVideo);

  if (inputRate !== null && inputAverageRate !== null && Math.abs(inputRate - inputAverageRate) > 0.001) {
    causes.push('input variable frame rate (r_frame_rate and avg_frame_rate differ)');
  }
  if (outputRate !== null && outputAverageRate !== null && Math.abs(outputRate - outputAverageRate) > 0.001) {
    causes.push('output variable frame rate (r_frame_rate and avg_frame_rate differ)');
  }
  if (inputPackets && (
    inputPackets.missingTimestampCount > 0 ||
    inputPackets.nonMonotonicTimestampCount > 0 ||
    inputPackets.largeGapCount > 0
  )) {
    causes.push('input video packet timestamps are missing, non-monotonic, or contain large gaps');
  }
  if (outputPackets && (
    outputPackets.missingTimestampCount > 0 ||
    outputPackets.nonMonotonicTimestampCount > 0 ||
    outputPackets.largeGapCount > 0
  )) {
    causes.push('output video packet timestamps are missing, non-monotonic, or contain large gaps');
  }
  if (inputPackets?.sparseKeyframes || outputPackets?.sparseKeyframes) {
    causes.push('keyframes are more than 2 seconds apart');
  }
  if (inputVideoStart !== null && inputAudioStart !== null && Math.abs(inputVideoStart - inputAudioStart) > 0.1) {
    causes.push(`input audio/video start offset is ${(inputAudioStart - inputVideoStart).toFixed(3)}s`);
  }
  if (outputVideoStart !== null && outputAudioStart !== null && Math.abs(outputVideoStart - outputAudioStart) > 0.1) {
    causes.push(`output audio/video start offset is ${(outputAudioStart - outputVideoStart).toFixed(3)}s`);
  }
  if (outputVideo && outputVideo.pix_fmt !== 'yuv420p') {
    causes.push(`output pixel format ${outputVideo.pix_fmt || 'unknown'} may not be supported by local players`);
  }
  if (outputAudio?.sample_rate && outputAudio.sample_rate !== '44100') {
    causes.push(`output audio sample rate is ${outputAudio.sample_rate} Hz instead of 44100 Hz`);
  }
  if (
    outputProbeUnavailable ||
    (expectedDuration !== null && outputDuration !== null && outputDuration < expectedDuration - 1) ||
    (expectedDuration === null && inputDuration !== null && outputDuration !== null && outputDuration < inputDuration - 1) ||
    outputSize === 0
  ) {
    causes.push('output may be truncated or shorter than the requested/input duration');
  }
  return causes.length ? causes : ['no obvious timestamp or stream-format issue detected in the available probe data'];
}

export async function collectVideoDiagnostics(
  ffprobePath: string,
  inputPath: string,
  outputPath: string,
  expectedDuration: number | null,
  outputSize: number
): Promise<VideoDiagnostics> {
  const input = await probeFile(ffprobePath, inputPath);
  const inputPackets = await probeVideoPackets(ffprobePath, inputPath);
  const output = outputSize > 0 ? await probeFile(ffprobePath, outputPath) : null;
  const outputPackets = outputSize > 0 ? await probeVideoPackets(ffprobePath, outputPath) : null;
  const likelyCauses = buildLikelyCauses(
    input,
    output,
    inputPackets,
    outputPackets,
    expectedDuration,
    outputSize
  );
  const report = [
    'Video export diagnostics',
    ...describeFile('Raw input', input, inputPackets),
    ...describeFile('Exported output', output, outputPackets),
    `Most likely cause: ${likelyCauses.join('; ')}.`,
  ].join('\n');

  return {
    report,
    data: { input, output, inputPackets, outputPackets },
  };
}
