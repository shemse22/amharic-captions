export interface SubtitleSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface SubtitleStyleOptions {
  fontSize: number; // px at base preview
  textColor: string;
  bgColor: string;
  bgOpacity: number;
  strokeColor: string;
  strokeWidth: number;
  shadowColor?: string;
  shadowBlur?: number;
  position: 'bottom' | 'middle' | 'top' | 'safe-bottom';
  positionPercent?: number; // 0 to 100 vertical position
  animation: 'none' | 'up-down' | 'pop' | 'slide' | 'karaoke' | 'word-select' | 'popup-word-by-word' | 'single-word' | 'glow' | 'fade';
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  watermark?: 'none' | 'logo-160' | 'logo-icon-160';
  fontFamily?: string;
  wordHighlightColor?: string;
  wordHighlightTextColor?: string;
  secondaryColor?: string;
}

export function formatTimeSRT(seconds: number): string {
  const pad = (num: number, size = 2) => String(Math.floor(num)).padStart(size, '0');
  const h = pad(seconds / 3600);
  const m = pad((seconds % 3600) / 60);
  const s = pad(seconds % 60);
  const ms = pad((seconds - Math.floor(seconds)) * 1000, 3);
  return `${h}:${m}:${s},${ms}`;
}

export function formatTimeVTT(seconds: number): string {
  const pad = (num: number, size = 2) => String(Math.floor(num)).padStart(size, '0');
  const h = pad(seconds / 3600);
  const m = pad((seconds % 3600) / 60);
  const s = pad(seconds % 60);
  const ms = pad((seconds - Math.floor(seconds)) * 1000, 3);
  return `${h}:${m}:${s}.${ms}`;
}

export function formatTimeASS(seconds: number): string {
  const pad = (num: number, size = 2) => String(Math.floor(num)).padStart(size, '0');
  const h = Math.floor(seconds / 3600);
  const m = pad((seconds % 3600) / 60);
  const s = pad(seconds % 60);
  const cs = pad((seconds - Math.floor(seconds)) * 100, 2);
  return `${h}:${m}:${s}.${cs}`;
}

// 1. SRT Export (with UTF-8 BOM for Premiere Pro / CapCut compatibility)
export function exportToSRT(segments: SubtitleSegment[]): string {
  const body = segments
    .map((seg, idx) => {
      return `${idx + 1}\n${formatTimeSRT(seg.start)} --> ${formatTimeSRT(seg.end)}\n${seg.text.trim()}\n`;
    })
    .join('\n');
  return `\uFEFF${body}`;
}

// 2. VTT Export (with UTF-8 BOM)
export function exportToVTT(segments: SubtitleSegment[]): string {
  const body = segments
    .map((seg, idx) => {
      return `${idx + 1}\n${formatTimeVTT(seg.start)} --> ${formatTimeVTT(seg.end)}\n${seg.text.trim()}\n`;
    })
    .join('\n');
  return `\uFEFFWEBVTT - Exported with Bgern (ብገርን)\n\n${body}`;
}

// 3. ASS (Advanced SubStation Alpha) with styling (with UTF-8 BOM)
export function exportToASS(segments: SubtitleSegment[], style: SubtitleStyleOptions): string {
  // Convert hex color #RRGGBB to ASS &H00BBGGRR&
  const hex = style.textColor.replace('#', '');
  const r = hex.substring(0, 2) || 'FF';
  const g = hex.substring(2, 4) || 'FF';
  const b = hex.substring(4, 6) || '00';
  const assColor = `&H00${b}${g}${r}&`;

  const fontName = style.fontFamily || 'Noto Sans Ethiopic';
  const header = `[Script Info]
Title: Bgern Amharic Subtitles
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0
Timer: 100.0000

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: BgernStyle,${fontName},36,${assColor},&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,2,2,20,20,30,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = segments
    .map((seg) => {
      return `Dialogue: 0,${formatTimeASS(seg.start)},${formatTimeASS(seg.end)},BgernStyle,,0,0,0,,${seg.text.trim()}`;
    })
    .join('\n');

  return `\uFEFF${header}${events}`;
}

// 4. Plain Text Transcript (with UTF-8 BOM)
export function exportToTXT(segments: SubtitleSegment[]): string {
  const content = segments.map((s) => `[${formatTimeSRT(s.start)} - ${formatTimeSRT(s.end)}] ${s.text}`).join('\n\n');
  return `\uFEFF${content}`;
}

