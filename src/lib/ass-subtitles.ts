/**
 * Advanced SubStation Alpha (ASS) Subtitle Generator for Amharic / Multilingual Captions
 * Produces deterministic, styled, and animated subtitle files for native FFmpeg burning
 * matching the Studio browser preview across all presets and custom styles.
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
  fontWeight?: string;
  fontSize?: number; // CSS reference font size (at studio preview scale)
  fontColor?: string; // hex
  highlightColor?: string; // hex for primary highlight / main box
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
  hasKeywordHighlights?: boolean;
  wordAnimation?: string;
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

function getStrokeWidth(weight: 'None' | 'Small' | 'Medium' | 'Large' | number | undefined, scale: number): number {
  if (typeof weight === 'number') return Math.max(0, Math.round(weight * scale));
  switch (weight) {
    case 'Large':
      return Math.max(2, Math.round(2.5 * scale));
    case 'Medium':
      return Math.max(1, Math.round(1.6 * scale));
    case 'Small':
      return Math.max(1, Math.round(1.0 * scale));
    case 'None':
    default:
      return 0;
  }
}

function getShadowDepth(weight: 'None' | 'Small' | 'Medium' | 'Large' | number | undefined, scale: number): number {
  if (typeof weight === 'number') return Math.max(0, Math.round(weight * scale));
  switch (weight) {
    case 'Large':
      return Math.max(2, Math.round(3.2 * scale));
    case 'Medium':
      return Math.max(1, Math.round(2.0 * scale));
    case 'Small':
      return Math.max(1, Math.round(1.2 * scale));
    case 'None':
    default:
      return 0;
  }
}

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
  const isVertical = targetH > targetW;
  const isSquare = targetH === targetW;

  // Match the Studio preview container dimensions:
  // Vertical (9:16): 330px x 587px; Square (1:1): 330px x 330px; Landscape (16:9): 520px x 293px.
  // libass renders Noto Sans Ethiopic slightly taller than CSS em-box, so 0.92 factor gives exact visual parity.
  const refPreviewH = isVertical ? 587 : isSquare ? 330 : 320;
  const heightRatio = targetH / refPreviewH;
  const baseFontSize = style.fontSize ?? 28;
  const scaledFontSize = Math.max(20, Math.round(baseFontSize * heightRatio * 0.92));
  const scale = targetW / 330;

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

  // Box presets: Laura 2, Ali Abdaal, Custom Background (whole line in box),
  // Pill presets: Kendrick, Leon (only active word gets solid pill box via Layer 1 PillBox style)
  const isFullBoxMode = isLaura || isAli || hasCustomBg;
  const isPillMode = isKendrick || isLeon;
  const boxPadding = Math.max(4, Math.round(scale * 4.5));

  // Stroke & shadow for Layer 0 (Outline/Shadow layer)
  let strokeWidth = isFullBoxMode ? boxPadding : getStrokeWidth(style.strokeWeight ?? 'None', scale);
  let shadowDepth = isFullBoxMode ? 0 : getShadowDepth(style.shadowWeight ?? 'None', scale);

  if (isMrBeast) {
    strokeWidth = Math.max(3, Math.round(2.8 * scale));
    shadowDepth = Math.max(3, Math.round(2.8 * scale));
  } else if (isHormozi) {
    strokeWidth = Math.max(2, Math.round(2.3 * scale));
    shadowDepth = Math.max(2, Math.round(2.3 * scale));
  } else if (isKendrick && strokeWidth === 0 && shadowDepth === 0) {
    // Kendrick preview adds `textShadow: '0 1px 3px rgba(0,0,0,0.65)'` when stroke/shadow are None
    shadowDepth = Math.max(1, Math.round(1.4 * scale));
  }

  // Primary text color
  let primaryColorAss = hexToAssColor(style.fontColor || '#FFFFFF');
  if (isLaura) {
    primaryColorAss = hexToAssColor(style.fontColor || '#000000');
  } else if (isAli) {
    primaryColorAss = hexToAssColor(style.fontColor || '#111827');
  }

  // Outline / Box color for Default style
  let outlineColorAss = hexToAssColor(style.strokeColor || '#000000');
  if (isLaura) {
    outlineColorAss = hexToAssColor(style.highlightColor || '#FFFFFF');
  } else if (isAli) {
    outlineColorAss = hexToAssColor(style.emphasizedBgColor || '#E5E7EB');
  } else if (hasCustomBg) {
    outlineColorAss = hexToAssColor(style.emphasizedBgColor);
  }

  const fontFamily = style.fontFamily || 'Noto Sans Ethiopic';
  const weightRaw = (style.fontWeight || '').toLowerCase();
  const isBold =
    weightRaw === 'thin' || weightRaw === 'regular' || weightRaw === 'normal' || weightRaw === 'light'
      ? 0
      : -1;

  const highlightColorAss = hexToAssColor(style.highlightColor || '#FFDD00');
  const shadowColorAss = hexToAssColor(style.shadowColor || '#000000', isKendrick ? 90 : 60);

  const posX = Math.round(((style.positionX ?? 50) / 100) * targetW);
  const posY = Math.round(((style.positionY ?? 71) / 100) * targetH);

  const maxWords = Math.max(1, style.displayWordCount ?? 4);
  const breakLines = style.breakLines !== false;
  const hasAnimation = style.hasAnimation !== false;
  const hasPunctuation = style.hasPunctuation !== false;
  const hasKeywordHighlights = style.hasKeywordHighlights === true;
  const wordAnimation = style.wordAnimation || 'None';
  const textCase = style.textCase || 'Aa';
  const defaultBorderStyle = isFullBoxMode ? 3 : 1;

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
    `Style: Default,${fontFamily},${scaledFontSize},${primaryColorAss},${highlightColorAss},${outlineColorAss},${shadowColorAss},${isBold},0,0,0,100,100,0,0,${defaultBorderStyle},${strokeWidth},${shadowDepth},5,20,20,20,1`,
    // Dedicated BorderStyle=3 overlay style for Kendrick / Leon active-word solid pills
    `Style: PillBox,${fontFamily},${scaledFontSize},${primaryColorAss},${highlightColorAss},&HFF000000,&HFF000000,${isBold},0,0,0,100,100,0,0,3,${boxPadding},0,5,20,20,20,1`,
    '',
  ];

  const events = [
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ];

  const isVerticalStack = baseFontSize > 50;

  for (const seg of segments) {
    if (!seg || !seg.text || seg.end <= seg.start) continue;

    let text = seg.text.trim();
    if (textCase === 'AA') text = text.toUpperCase();
    if (textCase === 'aa') text = text.toLowerCase();

    const rawAllWords = text.replace(/\n/g, ' ').split(/\s+/).filter(Boolean);
    if (rawAllWords.length === 0) continue;

    const segStart = seg.start;
    const segEnd = seg.end;
    const segDuration = Math.max(0.1, segEnd - segStart);

    // Chunk into readable subtitle phrases (matching Studio Preview slice logic)
    const chunkCount = Math.ceil(rawAllWords.length / maxWords);
    const chunkDuration = segDuration / chunkCount;

    for (let cIdx = 0; cIdx < chunkCount; cIdx++) {
      let chunkWords = rawAllWords.slice(cIdx * maxWords, (cIdx + 1) * maxWords);
      if (chunkWords.length === 0) continue;

      // Apply punctuation rules per chunk matching Studio Preview
      if (hasPunctuation) {
        const lastIdx = chunkWords.length - 1;
        const lastW = chunkWords[lastIdx];
        if (!/[።፣፤፥፦፧፨.,!?;:]/.test(lastW)) {
          const isQuestion = chunkWords.some((w) =>
            w.includes('እንዴት') || w.includes('ለምን') || w.includes('መቼ') || w.includes('ስንት') || w.includes('ትፈልጋለህ')
          );
          chunkWords[lastIdx] = lastW + (isQuestion ? '?' : '።');
        }
      } else {
        chunkWords = chunkWords.map((w) => w.replace(/[።፣፤፥፦፧፨.,!?;:]/g, ''));
      }

      const chunkStart = segStart + cIdx * chunkDuration;
      const chunkEnd = Math.min(segEnd, chunkStart + chunkDuration);
      const wordCount = chunkWords.length;
      const wordDuration = Math.max(0.08, (chunkEnd - chunkStart) / wordCount);

      // Compute lines matching Studio Preview `previewLines`
      const getLines = (): string[][] => {
        if (isVerticalStack && chunkWords.length > 1) {
          return chunkWords.map((w) => [w]);
        }
        if (breakLines && chunkWords.length > 1) {
          if (chunkWords.length === 4) {
            return [chunkWords.slice(0, 3), chunkWords.slice(3)];
          }
          if (chunkWords.length === 3) {
            return [chunkWords.slice(0, 2), chunkWords.slice(2)];
          }
          if (chunkWords.length === 2) {
            return [[chunkWords[0]], [chunkWords[1]]];
          }
          const half = Math.ceil(chunkWords.length / 2);
          return [chunkWords.slice(0, half), chunkWords.slice(half)];
        }
        return [chunkWords];
      };

      const lines = getLines();

      // Layer 0 formatter (for full-box, outline, keyword-highlight, or inactive base of Pill presets)
      const formatLayer0 = (activeWordIndex = -1): string => {
        let globalWordIdx = 0;
        return lines
          .map((lineWords) => {
            const lineStr = lineWords
              .map((w) => {
                const escaped = escapeAssText(w);
                const idx = globalWordIdx;
                const isCurrentActive = idx === activeWordIndex;
                const isPast = idx < activeWordIndex;
                globalWordIdx++;

                // Pill presets (Kendrick / Leon):
                // On Layer 0, inactive words show crisp normal text + shadow/stroke;
                // active word is hidden (\alpha&HFF&) so Layer 1 PillBox renders cleanly over it.
                if (isPillMode) {
                  if (hasAnimation && isCurrentActive) {
                    return `{\\alpha&HFF&}${escaped}{\\alpha&H00&}`;
                  }
                  const normalText = isLeon ? hexToAssColor('#FFFFFF') : hexToAssColor(style.fontColor || '#FFFFFF');
                  return `{\\1a&H00&\\c${normalText}}${escaped}`;
                }

                // Laura 2: White rounded background box, active word has neon lime (#DAF434) pill box
                if (isLaura) {
                  const whiteBox = hexToAssColor(style.highlightColor || '#FFFFFF');
                  const limePill = hexToAssColor(style.secondHighlightColor || '#DAF434');
                  const textColor = hexToAssColor(style.fontColor || '#000000');
                  if (hasAnimation && isCurrentActive) {
                    return `{\\3c${limePill}\\c${textColor}}${escaped}{\\3c${whiteBox}\\c${textColor}}`;
                  }
                  return `{\\3c${whiteBox}\\c${textColor}}${escaped}`;
                }

                // Ali Abdaal: Light gray background box (#E5E7EB), past/active dark gray, upcoming muted gray
                if (isAli) {
                  const aliBox = hexToAssColor(style.emphasizedBgColor || '#E5E7EB');
                  const activeText = hexToAssColor(style.fontColor || '#111827');
                  const futureText = hexToAssColor('#9CA3AF');
                  const wordCol = !hasAnimation || isCurrentActive || isPast ? activeText : futureText;
                  return `{\\3c${aliBox}\\c${wordCol}}${escaped}`;
                }

                // MrBeast: Yellow / Cyan alternating highlight on active word
                if (isMrBeast) {
                  const yellowAss = hexToAssColor(style.highlightColor || '#FFE600');
                  const cyanAss = hexToAssColor(style.secondHighlightColor || '#00F0FF');
                  const whiteAss = hexToAssColor('#FFFFFF');
                  if (hasAnimation && isCurrentActive) {
                    const activeColor = idx % 2 === 0 ? yellowAss : cyanAss;
                    return `{\\c${activeColor}}${escaped}{\\c${whiteAss}}`;
                  }
                  return `{\\c${whiteAss}}${escaped}`;
                }

                // Alex Hormozi: Primary highlight color on active word
                if (isHormozi) {
                  const activeAss = hexToAssColor(style.highlightColor || '#FFFF00');
                  const whiteAss = hexToAssColor('#FFFFFF');
                  if (hasAnimation && isCurrentActive) {
                    return `{\\c${activeAss}}${escaped}{\\c${whiteAss}}`;
                  }
                  return `{\\c${whiteAss}}${escaped}`;
                }

                // Custom Background Box
                if (hasCustomBg) {
                  const bgAss = hexToAssColor(style.emphasizedBgColor);
                  const c1 = hexToAssColor(style.highlightColor || '#FFDD00');
                  const c2 = hexToAssColor(style.secondHighlightColor || '#00FF66');
                  const c3 = hexToAssColor(style.thirdHighlightColor || '#FFFFFF');
                  const normalText = hexToAssColor(style.fontColor || '#FFFFFF');
                  if (hasKeywordHighlights) {
                    const cycleColor = idx % 3 === 0 ? c1 : idx % 3 === 1 ? c2 : c3;
                    return `{\\3c${bgAss}\\c${cycleColor}}${escaped}`;
                  }
                  const wordCol = !hasAnimation || isCurrentActive || isPast ? normalText : hexToAssColor(style.fontColor || '#FFFFFF', 140);
                  return `{\\3c${bgAss}\\c${wordCol}}${escaped}`;
                }

                // Keyword Highlight presets (Dan, William, Tracy, Kelly, Maya, etc.)
                if (hasKeywordHighlights) {
                  const c1 = hexToAssColor(style.highlightColor || '#00FF66');
                  const c2 = hexToAssColor(style.secondHighlightColor || '#FFFF00');
                  const c3 = hexToAssColor(style.thirdHighlightColor || '#FFFFFF');
                  const cycleColor = idx % 3 === 0 ? c1 : idx % 3 === 1 ? c2 : c3;
                  return `{\\c${cycleColor}}${escaped}`;
                }

                // Standard Karaoke styling (matches Studio Preview lines 5078-5092)
                const activeCol = hexToAssColor(style.fontColor || '#FFFFFF');
                const dimAlpha = wordAnimation === 'opacity 30' ? '&HB2&' : '&H8C&';
                if (!hasAnimation || isCurrentActive || (wordAnimation !== 'opacity 30' && isPast)) {
                  return `{\\1a&H00&\\c${activeCol}}${escaped}`;
                }
                const mutedCol = (style.fontColor || '#FFFFFF').toLowerCase() === '#000000'
                  ? hexToAssColor('#9CA3AF')
                  : activeCol;
                return `{\\1a${dimAlpha}\\c${mutedCol}}${escaped}{\\1a&H00&}`;
              })
              .join(' ');
            return lineStr;
          })
          .join('\\N');
      };

      // Layer 1 PillBox formatter (ONLY for Kendrick / Leon active word pill)
      const formatPillLayer = (activeWordIndex: number): string => {
        const pillColor = isKendrick
          ? hexToAssColor(style.secondHighlightColor || '#13fd00')
          : hexToAssColor(style.highlightColor || '#FF5700');
        const activeText = isKendrick ? hexToAssColor('#000000') : hexToAssColor('#FFFFFF');

        let globalWordIdx = 0;
        return lines
          .map((lineWords) => {
            const lineStr = lineWords
              .map((w) => {
                const escaped = escapeAssText(w);
                const isCurrentActive = globalWordIdx === activeWordIndex;
                globalWordIdx++;
                if (isCurrentActive) {
                  return `{\\alpha&H00&\\3a&H00&\\3c${pillColor}\\c${activeText}}${escaped}{\\alpha&HFF&\\3a&HFF&\\3c&HFF000000&}`;
                }
                return `{\\alpha&HFF&\\3a&HFF&\\3c&HFF000000&}${escaped}`;
              })
              .join(' ');
            return lineStr;
          })
          .join('\\N');
      };

      if (hasAnimation && wordCount > 1) {
        for (let wIdx = 0; wIdx < wordCount; wIdx++) {
          const wStart = chunkStart + wIdx * wordDuration;
          const wEnd = Math.min(chunkEnd, wStart + wordDuration);
          events.push(
            `Dialogue: 0,${formatAssTime(wStart)},${formatAssTime(wEnd)},Default,,0,0,0,,{\\an5\\pos(${posX},${posY})}${formatLayer0(wIdx)}`
          );
          if (isPillMode) {
            events.push(
              `Dialogue: 1,${formatAssTime(wStart)},${formatAssTime(wEnd)},PillBox,,0,0,0,,{\\an5\\pos(${posX},${posY})}${formatPillLayer(wIdx)}`
            );
          }
        }
      } else if (hasAnimation && wordCount === 1 && isPillMode) {
        events.push(
          `Dialogue: 0,${formatAssTime(chunkStart)},${formatAssTime(chunkEnd)},Default,,0,0,0,,{\\an5\\pos(${posX},${posY})}${formatLayer0(0)}`
        );
        events.push(
          `Dialogue: 1,${formatAssTime(chunkStart)},${formatAssTime(chunkEnd)},PillBox,,0,0,0,,{\\an5\\pos(${posX},${posY})}${formatPillLayer(0)}`
        );
      } else {
        events.push(
          `Dialogue: 0,${formatAssTime(chunkStart)},${formatAssTime(chunkEnd)},Default,,0,0,0,,{\\an5\\pos(${posX},${posY})}${formatLayer0(-1)}`
        );
      }
    }
  }

  return [...scriptInfo, ...styles, ...events, ''].join('\n');
}
