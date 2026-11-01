import { NextResponse } from "next/server";

function getHasabApiKey(): string {
  const key = process.env.HASAB_API_KEY || process.env.Hasab || process.env.HASAB_KEY;
  if (!key) {
    throw new Error("Hasab API key is not configured. Please set Hasab or HASAB_API_KEY in your .env file.");
  }
  return key.trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body.text;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    const apiKey = getHasabApiKey();

    const prompt = `You are a precise bilingual Amharic-English caption editor.
Clean up the following caption text into natural, correct mixed Amharic-English subtitles.
RULES:
1. Output ONLY the corrected caption text.
2. Amharic words must use proper Ethiopic/Ge'ez characters.
3. English words must stay in normal Latin English spelling. Do not transliterate English words into Ge'ez letters.
4. Keep English brand names, app names, product names, acronyms, people names, and technical words in English, for example YouTube, TikTok, Facebook, AI, OpenAI, iPhone, website, subscribe.
5. Write numbers as digit symbols, not words. Use 1, 2, 10, 25, 100, 2026, 3.5, 50%, $20, 5K as appropriate.
6. Do not explain anything, do not output quotes or greetings, return only the clean corrected line.

Input:
${text}`;

    const response = await fetch("https://api.hasab.ai/api/v1/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        message: prompt,
        model: "hasab-1-main",
        temperature: 0.1,
        max_tokens: 1024,
        stream: false,
      }),
    });

    const result = await response.json();

    if (!response.ok || result?.status === "error") {
      throw new Error(result?.message || result?.error?.message || "AI caption correction failed");
    }

    const corrected =
      result?.message?.content?.trim() ||
      result?.choices?.[0]?.message?.content?.trim() ||
      text;

    return NextResponse.json({ text: corrected });
  } catch (error: any) {
    console.error("Correction error:", error);
    return NextResponse.json(
      { error: error?.message || "Correction failed" },
      { status: 500 }
    );
  }
}
