/**
 * Advanced SubStation Alpha (ASS) Subtitle Generator for Amharic / Multilingual Captions
 * Produces deterministic, styled, and animated subtitle files for native FFmpeg burning.
 */

export interface CaptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface CaptionStyleOptions {
  presetId?: string;
  presetName?: string;
  fontFamily?: string;
  fontSize?: number; // CSS reference font size (at ~360px viewport)
  fontColor?: string; // hex
  highlightColor?: string; // hex for active word highlight
  secondHighlightColor?: string;
  thirdHighlightColor?: string;
  emphasizedBgColor?: string;
  strokeColor?: string; // hex
  strokeWeight?: 'None' | 'Small' | 'Medium' | 'Large' | number;
  shadowColor?: string; // hex
  shadowWeight?: 'None' | 'Small' | 'Medium' | 'Large' | number;
  positionX?: number; // percentage (0 - 100)
  positionY?: number; // percentage (0 - 100)
  displayWordCount?: number;
  breakLines?: boolean;
  hasAnimation?: boolean;
  textCase?: 'Aa' | 'AA' | 'aa';
  hasPunctuation?: boolean;
}

export interface GenerateAssOptions {
  segments: CaptionSegment[];
  videoWidth: number;
  videoHeight: number;
  style?: CaptionStyleOptions;
}

/**
 * Converts CSS hex color (#RRGGBB or #RRGGBBAA) to ASS color format (&HAABBGGRR).
 * In ASS, alpha 00 = completely opaque, FF = completely transparent.
 */
export function hexToAssColor(hex?: string, defaultAlpha = 0): string {
  if (!hex || hex === 'transparent' || hex.toLowerCase() === '#00000000') {
    return '&HFF000000';
  }
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const r = clean.slice(0, 2) || 'FF';
  const g = clean.slice(2, 4) || 'FF';
  const b = clean.slice(4, 6) || 'FF';
  let a = defaultAlpha.toString(16).padStart(2, '0');

  if (clean.length === 8) {
    const cssA = parseInt(clean.slice(6, 8), 16);
    a = Math.max(0, Math.min(255, 255 - cssA)).toString(16).padStart(2, '0');
  }

  return `&H${a.toUpperCase()}${b.toUpperCase()}${g.toUpperCase()}${r.toUpperCase()}`;
}

/**
 * Formats seconds into ASS timestamp format: H:MM:SS.cs (e.g. 0:01:23.45)
 */
export function formatAssTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const cs = Math.min(99, Math.floor((s % 1) * 100));
  return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

/**
 * Maps stroke weight setting to pixel width scaled to target video resolution
 */
function getStrokeWidth(weight: 'None' | 'Small' | 'Medium' | 'Large' | number | undefined, scale: number): number {
  if (typeof weight === 'number') return Math.max(0, Math.round(weight * scale));
  switch (weight) {
    case 'Large':
      return Math.round(3.5 * scale);
    case 'Medium':
      return Math.round(2.5 * scale);
    case 'Small':
      return Math.round(1.5 * scale);
    case 'None':
    default:
      return 0;
  }
}

/**
 * Maps shadow weight setting to pixel depth scaled to target video resolution
 */
function getShadowDepth(weight: 'None' | 'Small' | 'Medium' | 'Large' | number | undefined, scale: number): number {
  if (typeof weight === 'number') return Math.max(0, Math.round(weight * scale));
  switch (weight) {
    case 'Large':
      return Math.round(4 * scale);
    case 'Medium':
      return Math.round(2.5 * scale);
    case 'Small':
      return Math.round(1.5 * scale);
    case 'None':
    default:
      return 0;
  }
}

/**
 * Escapes special ASS control characters in subtitle text.
 */
function escapeAssText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}');
}

/**
 * Generates standard ASS (Advanced SubStation Alpha) v4+ content for FFmpeg burning.
 */
export function generateAssSubtitles(options: GenerateAssOptions): string {
  const { segments, videoWidth, videoHeight, style = {} } = options;

  const targetW = videoWidth || 1080;
  const targetH = videoHeight || 1920;
  const isVertical = targetH >= targetW;

  // The web studio preview displays the video at approximately 320px wide (or 550px high for 9:16).
  // Scaling relative to height preserves exact relative font size across any video dimensions (720p, 1080p, 4K, 9:16, 16:9).
  const heightRatio = targetH / (isVertical ? 550 : 360);
  const baseFontSize = style.fontSize ?? 28;
  const scaledFontSize = Math.max(22, Math.round(baseFontSize * heightRatio));
  const scale = targetW / 360;

  const rawPreset = `${style.presetId || ''} ${style.presetName || ''}`.toLowerCase();
  const isLaura = rawPreset.includes('laura');
  const isAli = rawPreset.includes('ali');
  const isKendrick = rawPreset.includes('kendrick');
  const isLeon = rawPreset.includes('leon');
  const isMrBeast = rawPreset.includes('beast');
  const isHormozi = rawPreset.includes('hormozi');

  const hasCustomBg = Boolean(
    style.emphasizedBgColor &&
    style.emphasizedBgColor !== 'transparent' &&
    style.emphasizedBgColor.toLowerCase() !== '#00000000'
  );

  const isBoxMode = isLaura || isAli || hasCustomBg;
  const borderStyleVal = isBoxMode ? 3 : 1;
  const boxPadding = Math.round(scale * 7);

  let strokeWidth = isBoxMode ? boxPadding : getStrokeWidth(style.strokeWeight ?? 'Small', scale);
  let shadowDepth = isBoxMode ? 0 : getShadowDepth(style.shadowWeight ?? 'Small', scale);

  if (!isBoxMode && (isMrBeast || isHormozi)) {
    strokeWidth = Math.max(3, Math.round(3.5 * scale));
    shadowDepth = Math.max(3, Math.round(3 * scale));
  }

  // Primary text color
  let primaryColorAss = hexToAssColor(style.fontColor || '#FFFFFF');
  if (isLaura) {
    primaryColorAss = hexToAssColor(style.fontColor || '#000000');
  } else if (isAli) {
    primaryColorAss = hexToAssColor(style.fontColor || '#111827');
  }

  // Outline / Box color
  let outlineColorAss = hexToAssColor(style.strokeColor || '#000000');
  if (isLaura) {
    outlineColorAss = hexToAssColor(style.highlightColor || '#FFFFFF'); // White background box
  } else if (isAli) {
    outlineColorAss = hexToAssColor(style.emphasizedBgColor || '#E5E7EB'); // Light Gray box
  } else if (hasCustomBg) {
    outlineColorAss = hexToAssColor(style.emphasizedBgColor);
  }

  const fontFamily = style.fontFamily || 'Noto Sans Ethiopic';
  const highlightColorAss = hexToAssColor(style.highlightColor || '#FFDD00');
  const shadowColorAss = hexToAssColor(style.shadowColor || '#000000', 60);

  const posX = Math.round(((style.positionX ?? 50) / 100) * targetW);
  const posY = Math.round(((style.positionY ?? 71) / 100) * targetH);

  const maxWords = Math.max(1, style.displayWordCount ?? 4);
  const breakLines = style.breakLines !== false;
  const hasAnimation = style.hasAnimation !== false;
  const hasPunctuation = style.hasPunctuation !== false;
  const textCase = style.textCase || 'Aa';

  const scriptInfo = [
    '[Script Info]',
    'Title: Bgern Amharic Subtitles',
    'ScriptType: v4.00+',
    'WrapStyle: 2',
    'ScaledBorderAndShadow: yes',
    'YCbCr Matrix: TV.709',
    `PlayResX: ${targetW}`,
    `PlayResY: ${targetH}`,
    '',
  ];

  const styles = [
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: Default,${fontFamily},${scaledFontSize},${primaryColorAss},${highlightColorAss},${outlineColorAss},${shadowColorAss},-1,0,0,0,100,100,0,0,${borderStyleVal},${strokeWidth},${shadowDepth},5,20,20,20,1`,
    '',
  ];

  const events = [
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ];

  for (const seg of segments) {
    if (!seg || !seg.text || seg.end <= seg.start) continue;

    let text = seg.text.trim();
    if (textCase === 'AA') text = text.toUpperCase();
    if (textCase === 'aa') text = text.toLowerCase();

    let allWords = text.replace(/\n/g, ' ').split(/\s+/).filter(Boolean);
    if (allWords.length === 0) continue;

    // Apply Ethiopian punctuation rules
    if (hasPunctuation) {
      const lastIdx = allWords.length - 1;
      const lastW = allWords[lastIdx];
      if (!/[።፣፤፥፦፧፨.,!?;:]/.test(lastW)) {
        const isQuestion = allWords.some((w) =>
          w.includes('እንዴት') || w.includes('ለምን') || w.includes('መቼ') || w.includes('ስንት') || w.includes('ትፈልጋለህ')
        );
        allWords[lastIdx] = lastW + (isQuestion ? '?' : '።');
      }
    } else {
      allWords = allWords.map((w) => w.replace(/[።፣፤፥፦፧፨.,!?;:]/g, ''));
    }

    const segStart = seg.start;
    const segEnd = seg.end;
    const segDuration = Math.max(0.1, segEnd - segStart);

    // Chunk into readable subtitle phrases
    const chunkCount = Math.ceil(allWords.length / maxWords);
    const chunkDuration = segDuration / chunkCount;

    for (let cIdx = 0; cIdx < chunkCount; cIdx++) {
      const chunkWords = allWords.slice(cIdx * maxWords, (cIdx + 1) * maxWords);
      if (chunkWords.length === 0) continue;

      const chunkStart = segStart + cIdx * chunkDuration;
      const chunkEnd = Math.min(segEnd, chunkStart + chunkDuration);
      const wordCount = chunkWords.length;
      const wordDuration = Math.max(0.08, (chunkEnd - chunkStart) / wordCount);

      // Break chunk into two lines if enabled and multiple words
      const formatLines = (activeWordIndex = -1): string => {
        let lines: string[][];
        if (breakLines && chunkWords.length > 2) {
          if (chunkWords.length === 4) {
            lines = [chunkWords.slice(0, 3), chunkWords.slice(3)];
          } else if (chunkWords.length === 3) {
            lines = [chunkWords.slice(0, 2), chunkWords.slice(2)];
          } else {
            const half = Math.ceil(chunkWords.length / 2);
            lines = [chunkWords.slice(0, half), chunkWords.slice(half)];
          }
        } else {
          lines = [chunkWords];
        }

        let globalWordIdx = 0;
        return lines
          .map((lineWords) => {
            const lineStr = lineWords
              .map((w) => {
                const escaped = escapeAssText(w);
                const isCurrentActive = globalWordIdx === activeWordIndex;
                globalWordIdx++;

                // Laura 2: White rounded background box, active word has neon lime (#DAF434) pill box
                if (isLaura) {
                  const whiteBox = hexToAssColor(style.highlightColor || '#FFFFFF');
                  const limePill = hexToAssColor(style.secondHighlightColor || '#DAF434');
                  const textColor = hexToAssColor(style.fontColor || '#000000');
                  if (hasAnimation && isCurrentActive) {
                    return `{\\3c${limePill}\\c${textColor}}${escaped}`;
                  }
                  return `{\\3c${whiteBox}\\c${textColor}}${escaped}`;
                }

                // Kendrick: Active word has lime green pill (#13fd00) with black text
                if (isKendrick) {
                  const limePill = hexToAssColor(style.secondHighlightColor || '#13fd00');
                  const activeText = hexToAssColor('#000000');
                  const normalText = hexToAssColor(style.fontColor || '#FFFFFF');
                  if (hasAnimation && isCurrentActive) {
                    return `{\\3c${limePill}\\c${activeText}}${escaped}`;
                  }
                  return `{\\3c&HFF000000&\\c${normalText}}${escaped}`;
                }

                // Leon: Active word has solid orange (#FF5700) pill with white text
                if (isLeon) {
                  const orangePill = hexToAssColor(style.highlightColor || '#FF5700');
                  const whiteText = hexToAssColor('#FFFFFF');
                  if (hasAnimation && isCurrentActive) {
                    return `{\\3c${orangePill}\\c${whiteText}}${escaped}`;
                  }
                  return `{\\3c&HFF000000&\\c${whiteText}}${escaped}`;
                }

                // Ali Abdaal: Light gray background box (#E5E7EB), dark gray text
                if (isAli) {
                  const aliBox = hexToAssColor(style.emphasizedBgColor || '#E5E7EB');
                  const activeText = hexToAssColor(style.fontColor || '#111827');
                  const normalText = hexToAssColor('#9CA3AF');
                  if (hasAnimation && isCurrentActive) {
                    return `{\\3c${aliBox}\\c${activeText}}${escaped}`;
                  }
                  return `{\\3c${aliBox}\\c${normalText}}${escaped}`;
                }

                // MrBeast: Electric yellow / cyan alternating highlights
                if (isMrBeast) {
                  const yellowAss = hexToAssColor(style.highlightColor || '#FFE600');
                  const cyanAss = hexToAssColor(style.secondHighlightColor || '#00F0FF');
                  const whiteAss = hexToAssColor(style.fontColor || '#FFFFFF');
                  if (hasAnimation && isCurrentActive) {
                    const activeColor = (globalWordIdx - 1) % 2 === 0 ? yellowAss : cyanAss;
                    return `{\\c${activeColor}}${escaped}{\\c${whiteAss}}`;
                  }
                  return escaped;
                }

                // Alex Hormozi: Electric yellow (#FFFF00) highlight
                if (isHormozi) {
                  const yellowAss = hexToAssColor(style.highlightColor || '#FFFF00');
                  const whiteAss = hexToAssColor(style.fontColor || '#FFFFFF');
                  if (hasAnimation && isCurrentActive) {
                    return `{\\c${yellowAss}}${escaped}{\\c${whiteAss}}`;
                  }
                  return escaped;
                }

                // Custom Background Box
                if (hasCustomBg) {
                  const bgAss = hexToAssColor(style.emphasizedBgColor);
                  const activeText = hexToAssColor(style.highlightColor || '#FFDD00');
                  const normalText = hexToAssColor(style.fontColor || '#FFFFFF');
                  if (hasAnimation && isCurrentActive) {
                    return `{\\3c${bgAss}\\c${activeText}}${escaped}`;
                  }
                  return `{\\3c${bgAss}\\c${normalText}}${escaped}`;
                }

                // Default standard outline + shadow with active word highlight
                if (hasAnimation && isCurrentActive) {
                  return `{\\c${highlightColorAss}}${escaped}{\\c${primaryColorAss}}`;
                }
                return escaped;
              })
              .join(' ');
            return lineStr;
          })
          .join('\\N');
      };

      if (hasAnimation && wordCount > 1) {
        // Emit timed sub-interval events for each active word highlight
        for (let wIdx = 0; wIdx < wordCount; wIdx++) {
          const wStart = chunkStart + wIdx * wordDuration;
          const wEnd = Math.min(chunkEnd, wStart + wordDuration);
          const lineText = formatLines(wIdx);
          events.push(
            `Dialogue: 0,${formatAssTime(wStart)},${formatAssTime(wEnd)},Default,,0,0,0,,{\\an5\\pos(${posX},${posY})}${lineText}`
          );
        }
      } else {
        const lineText = formatLines(-1);
        events.push(
          `Dialogue: 0,${formatAssTime(chunkStart)},${formatAssTime(chunkEnd)},Default,,0,0,0,,{\\an5\\pos(${posX},${posY})}${lineText}`
        );
      }
    }
  }

  return [...scriptInfo, ...styles, ...events, ''].join('\n');
}
