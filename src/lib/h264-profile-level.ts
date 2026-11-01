/**
 * H.264 Profile & Level Conformance Specifications (ITU-T H.264 / ISO/IEC 14496-10 Table A-1)
 *
 * Used across the caption burn-in export pipeline to guarantee hardware decoder compatibility
 * and eliminate video freeze bugs on local playback by enforcing High Profile and explicit Levels
 * with strictly >= 15% headroom above required Macroblocks Per Second (MBPS).
 */

export interface H264LevelSpecification {
  level: string;
  levelIdc: number; // e.g. 40, 42, 51
  hexCode: string; // e.g. '28', '2A', '33'
  maxMbps: number; // Macroblocks Per Second ceiling
  maxFs: number; // Max Frame Size in macroblocks
}

// Standard ITU-T H.264 Table A-1 Level Limits
export const H264_LEVEL_LIMITS: Record<string, H264LevelSpecification> = {
  '3.0': { level: '3.0', levelIdc: 30, hexCode: '1E', maxMbps: 40500, maxFs: 1620 },
  '3.1': { level: '3.1', levelIdc: 31, hexCode: '1F', maxMbps: 108000, maxFs: 3600 },
  '3.2': { level: '3.2', levelIdc: 32, hexCode: '20', maxMbps: 216000, maxFs: 5120 },
  '4.0': { level: '4.0', levelIdc: 40, hexCode: '28', maxMbps: 245760, maxFs: 8192 },
  '4.1': { level: '4.1', levelIdc: 41, hexCode: '29', maxMbps: 245760, maxFs: 8192 },
  '4.2': { level: '4.2', levelIdc: 42, hexCode: '2A', maxMbps: 522240, maxFs: 8704 },
  '5.0': { level: '5.0', levelIdc: 50, hexCode: '32', maxMbps: 589824, maxFs: 22080 },
  '5.1': { level: '5.1', levelIdc: 51, hexCode: '33', maxMbps: 983040, maxFs: 36864 },
  '5.2': { level: '5.2', levelIdc: 52, hexCode: '34', maxMbps: 2073600, maxFs: 36864 },
};

export interface H264ExportProfileConfig {
  combinationKey: '720p30' | '720p60' | '1080p30' | '1080p60';
  resolution: '720p' | '1080p';
  width: number;
  height: number;
  fps: 30 | 60;
  profile: 'High';
  level: string; // e.g. '4.0', '4.2', '5.1'
  avcCodecString: string; // e.g. 'avc1.640028', 'avc1.64002A', 'avc1.640033'
  picWidthInMbs: number;
  frameHeightInMbs: number;
  picSizeInMbs: number;
  requiredMbps: number;
  maxMbpsCeiling: number;
  headroomMbps: number;
  headroomPercentage: number;
  passedMinHeadroom: boolean; // >= 15%
}

/**
 * Calculates macroblock requirements and selects the explicit H.264 High Profile & Level
 * with >= 15% headroom above the required macroblocks per second.
 *
 * Macroblock Math:
 * - Macroblock size: 16x16 pixels
 * - PicWidthInMbs = ceil(width / 16)
 * - FrameHeightInMbs = ceil(height / 16)
 * - PicSizeInMbs = PicWidthInMbs * FrameHeightInMbs
 * - Required MBPS = PicSizeInMbs * fps
 * - Headroom % = ((MaxMBPS - RequiredMBPS) / RequiredMBPS) * 100
 */
export function getExplicitH264Config(
  resolution: '720p' | '1080p' | string,
  fps: number = 30,
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' = '9:16'
): H264ExportProfileConfig {
  const is1080p = resolution.toString().includes('1080');
  const targetFps: 30 | 60 = fps >= 45 ? 60 : 30;

  // Compute canonical pixel dimensions
  let width = is1080p ? 1080 : 720;
  let height = is1080p ? 1920 : 1280;

  if (aspectRatio === '16:9') {
    width = is1080p ? 1920 : 1280;
    height = is1080p ? 1080 : 720;
  } else if (aspectRatio === '1:1') {
    width = is1080p ? 1080 : 720;
    height = is1080p ? 1080 : 720;
  } else if (aspectRatio === '4:5') {
    width = is1080p ? 1080 : 720;
    height = is1080p ? 1350 : 900;
  }

  const picWidthInMbs = Math.ceil(width / 16);
  const frameHeightInMbs = Math.ceil(height / 16);
  const picSizeInMbs = picWidthInMbs * frameHeightInMbs;
  const requiredMbps = picSizeInMbs * targetFps;

  const resTag = is1080p ? '1080p' : '720p';
  const comboKey = `${resTag}${targetFps}` as '720p30' | '720p60' | '1080p30' | '1080p60';

  /**
   * Explicit Level Assignments for supported combinations:
   *
   * 1. 720p30:
   *    - PicSize: 45 * 80 = 3,600 MBs
   *    - Required MBPS: 3,600 * 30 = 108,000 MBPS
   *    - Level 3.1: MaxMBPS = 108,000 -> 0% headroom (FAIL: Causes decoder freeze!)
   *    - Level 4.0: MaxMBPS = 245,760 -> +127.56% headroom (PASS: >= 15%)
   *
   * 2. 720p60:
   *    - PicSize: 45 * 80 = 3,600 MBs
   *    - Required MBPS: 3,600 * 60 = 216,000 MBPS
   *    - Level 4.0 / 4.1: MaxMBPS = 245,760 -> +13.78% headroom (FAIL: < 15%)
   *    - Level 4.2: MaxMBPS = 522,240 -> +141.78% headroom (PASS: >= 15%)
   *
   * 3. 1080p30:
   *    - PicSize: 68 * 120 = 8,160 MBs
   *    - Required MBPS: 8,160 * 30 = 244,800 MBPS
   *    - Level 4.0 / 4.1: MaxMBPS = 245,760 -> +0.39% headroom (FAIL: < 15%)
   *    - Level 4.2: MaxMBPS = 522,240 -> +113.33% headroom (PASS: >= 15%)
   *
   * 4. 1080p60:
   *    - PicSize: 68 * 120 = 8,160 MBs
   *    - Required MBPS: 8,160 * 60 = 489,600 MBPS
   *    - Level 4.2: MaxMBPS = 522,240 -> +6.67% headroom (FAIL: < 15%)
   *    - Level 5.0: MaxMBPS = 589,824 -> +20.47% headroom (PASS: >= 15%)
   *    - Level 5.1: MaxMBPS = 983,040 -> +100.78% headroom (PASS: >= 15%, industry gold standard)
   */
  let assignedLevel = '4.0';
  if (comboKey === '720p30') {
    assignedLevel = '4.0';
  } else if (comboKey === '720p60') {
    assignedLevel = '4.2';
  } else if (comboKey === '1080p30') {
    assignedLevel = '4.2';
  } else if (comboKey === '1080p60') {
    assignedLevel = '5.1';
  }

  const spec = H264_LEVEL_LIMITS[assignedLevel];
  const maxMbpsCeiling = spec.maxMbps;
  const headroomMbps = maxMbpsCeiling - requiredMbps;
  const headroomPercentage = (headroomMbps / requiredMbps) * 100;

  // WebCodecs / MP4 MIME codec string:
  // avc1.PPCCLL where PP = 64 (High Profile, decimal 100), CC = 00, LL = level hex code
  const avcCodecString = `avc1.6400${spec.hexCode}`;

  return {
    combinationKey: comboKey,
    resolution: resTag,
    width,
    height,
    fps: targetFps,
    profile: 'High',
    level: assignedLevel,
    avcCodecString,
    picWidthInMbs,
    frameHeightInMbs,
    picSizeInMbs,
    requiredMbps,
    maxMbpsCeiling,
    headroomMbps,
    headroomPercentage,
    passedMinHeadroom: headroomPercentage >= 15.0,
  };
}

