import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getHasabApiKey(): string | null {
  const key = process.env.HASAB_API_KEY || process.env.Hasab || process.env.HASAB_KEY;
  return key ? key.trim() : null;
}

function getGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  return key ? key.trim() : null;
}

// Rule-based Amharic & Ge'ez typographic cleaner
function cleanEthiopicText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFC')
    // Remove repeated spaces
    .replace(/\s+/g, ' ')
    // Fix punctuation spacing: remove space before punctuation, ensure space after
    .replace(/\s+([።፣፤፥፦፧፨!?.,])/g, '$1')
    .replace(/([።፣፤፥፦፧፨])([^\s"'\)\]}])/g, '$1 $2')
    // Replace duplicate punctuation like ።። or ,,
    .replace(/[።]{2,}/g, '።')
    .replace(/[፣]{2,}/g, '፣')
    // Remove filler sounds common in speech transcription
    .replace(/\b(እእ+|አአ+|ኡኡ+|ኤኤ+|እም+|hmm+|um+)\b/gi, '')
    .trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const segments = body.segments;
    const text = body.text;

    if (!segments && !text) {
      return NextResponse.json({ error: 'Segments or text is required' }, { status: 400 });
    }

    // Polish single text
    if (typeof text === 'string') {
      let polished = cleanEthiopicText(text);
      const hasabKey = getHasabApiKey();

      if (hasabKey) {
        try {
          const res = await fetch('https://api.hasab.ai/api/v1/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${hasabKey}`,
            },
            body: JSON.stringify({
              message: `You are an expert Amharic proofreader. Fix any grammatical, spelling, or punctuation mistakes in this caption without changing its core meaning. Output ONLY the polished Amharic text:\n\n${text}`,
              model: 'hasab-1-main',
              temperature: 0.1,
              max_tokens: 512,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const aiText = data?.message?.content || data?.choices?.[0]?.message?.content;
            if (aiText && aiText.trim().length > 0) {
              polished = cleanEthiopicText(aiText);
            }
          }
        } catch (e) {
          console.warn('Hasab AI polish fallback to rule-based:', e);
        }
      }

      return NextResponse.json({ success: true, text: polished });
    }

    // Polish array of segments
    if (Array.isArray(segments)) {
      const polishedSegments = segments.map((seg: any) => ({
        ...seg,
        text: cleanEthiopicText(String(seg.text || '')),
      }));

      const hasabKey = getHasabApiKey();
      if (hasabKey && segments.length > 0 && segments.length <= 30) {
        try {
          const fullText = segments.map((s, idx) => `[${idx}] ${s.text}`).join('\n');
          const res = await fetch('https://api.hasab.ai/api/v1/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${hasabKey}`,
            },
            body: JSON.stringify({
              message: `Polish these Amharic video captions for spelling, grammar, and natural Ge'ez punctuation. Preserve the exact [0], [1], ... tags and line numbers:\n\n${fullText}`,
              model: 'hasab-1-main',
              temperature: 0.1,
              max_tokens: 2048,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const aiResponse = data?.message?.content || data?.choices?.[0]?.message?.content;
            if (aiResponse) {
              const lines = aiResponse.split('\n');
              for (const line of lines) {
                const match = line.match(/^\[(\d+)\]\s*(.+)$/);
                if (match) {
                  const idx = parseInt(match[1], 10);
                  if (polishedSegments[idx]) {
                    polishedSegments[idx].text = cleanEthiopicText(match[2]);
                  }
                }
              }
            }
          }
        } catch (err) {
          console.warn('Batch Hasab AI caption polish failed, kept rule-based:', err);
        }
      }

      return NextResponse.json({
        success: true,
        segments: polishedSegments,
        count: polishedSegments.length,
      });
    }

    return NextResponse.json({ error: 'Invalid input format' }, { status: 400 });
  } catch (error: any) {
    console.error('Polish API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to polish captions' },
      { status: 500 }
    );
  }
}

