import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface CaptionPackage {
  id: number;
  hook: string;
  caption: string;
  hashtags: string[];
  fullCaption: string;
  charCount: number;
  seoScore: number;
  tip: string;
}

const vibeConfig: Record<
  string,
  {
    enTitle: string;
    amTitle: string;
    amHooks: (topic: string, kw: string) => string[];
    enHooks: (topic: string, kw: string) => string[];
    ctasAm: string[];
    ctasEn: string[];
    tipsAm: string;
    tipsEn: string;
  }
> = {
  any: {
    enTitle: 'engaging',
    amTitle: 'አሳታፊ',
    amHooks: (t) => [
      `ይህን ካላዩ አትለፉ! 👀 ${t}`,
      `ማንም ሰው ያልነገረዎት ምሥጢር 🤫`,
      `ይህን በደንብ ይመልከቱት 👇`,
      `3 ሰከንድ ብቻ ስጡኝ... ሕይወታችሁ ይቀየራል! 🔥`,
      `ስለዚህ ነገር ምን ታስባላችሁ? 🤔`,
    ],
    enHooks: (t) => [
      `Stop scrolling — you need to see this! 👀`,
      `The secret nobody tells you about ${t} 🤫`,
      `Watch this before it gets taken down 🔥`,
      `Give me 3 seconds and I'll prove it 👇`,
      `I bet you didn't know this! ✨`,
    ],
    ctasAm: [
      '👍 Like ያድርጉ | 🔁 ለጓደኛዎ Share ያድርጉ | 💬 አስተያየትዎን ይፃፉ!',
      'ይህን ወደውታል? Like እና Share ማድረግ አይርሱ! 💬',
    ],
    ctasEn: [
      'Double tap if you agree! 👍 Share with a friend 🔁',
      'Follow for more daily content! ✨ Drop your thoughts below 👇',
    ],
    tipsAm: 'በመጀመሪያዎቹ 3 ሰከንዶች ውስጥ የቪዲዮዎን ዋና መልዕክት በግልጽ ያሳዩ።',
    tipsEn: 'Deliver the core value proposition within the first 3 seconds to maximize retention.',
  },
  playful: {
    enTitle: 'playful and fun',
    amTitle: 'አዝናኝ',
    amHooks: (t) => [
      `ይህን ሳይስቁ ማለፍ አይቻልም 😂 ${t}`,
      `እስቲ ማን ነው እንደዚህ አድርጎ የሚያውቅ? 🙈`,
      `ዛሬ ደግሞ ሌላ ጉድ አገኘሁላችሁ! 🤪`,
      `ይህን ተመልከቱት እና እስቲ ፍረዱ 🤣`,
    ],
    enHooks: (t) => [
      `Tell me I'm not the only one doing this 😂`,
      `Why is this so accurate though? 💀`,
      `You won't believe what happened here 😭`,
      `The chaos never stops! 🤪`,
    ],
    ctasAm: [
      'ሳቃችሁ? 😂 ሼር አድርጉት! 💬 የእናንተን ተሞክሮ ኮሜንት ላይ ጻፉልኝ',
      'ጓደኛችሁን Tag አድርጉበት! 👇🤣',
    ],
    ctasEn: [
      'Tag that one friend who needs to see this 😂👇',
      'Drop a 💀 in the comments if you relate!',
    ],
    tipsAm: 'ፈገግ የሚያደርጉ ኢሞጂዎችን እና ቀልጣፋ ድምጾችን በቪዲዮዎ ላይ ይጠቀሙ።',
    tipsEn: 'Use relatable humor and trending audio tracks to boost organic shares.',
  },
  trendy: {
    enTitle: 'trendy and hype',
    amTitle: 'ትሬንዲ',
    amHooks: (t) => [
      `በአሁኑ ሰዓት TikTok ላይ ቫይራል እየሆነ ያለው ነገር! 🔥`,
      `ይህ አዲሱ የ${t} ትሬንድ ነው 🚀`,
      `ከሁሉም ቀድመው ይሞክሩት! ⚡`,
      `ይህን ትሬንድ ካላወቁ ወደ ኋላ ቀርተዋል 👀`,
    ],
    enHooks: (t) => [
      `This trend is literally taking over TikTok right now 🔥`,
      `The new viral way everyone is doing ${t} 🚀`,
      `Try this before everyone else finds out ⚡`,
      `This went viral for a reason 👀`,
    ],
    ctasAm: [
      'ትሬንዱን ተቀላቀሉ! 🚀 Save አድርጉት በኋላ እንዳይጠፋባችሁ ✅',
      'አሁኑኑ ይሞክሩት እና ጓደኛችሁን Tag አድርጉ! 🔥',
    ],
    ctasEn: [
      'Save this audio and try it before it peaks! 🔥 Bookmark now 📌',
      'Hit that + to stay ahead of the algorithm! 🚀',
    ],
    tipsAm: 'በአሁኑ ሰዓት ትሬንድ ላይ ያለ ታዋቂ ሙዚቃ ወይም ድምፅ ይጠቀሙ።',
    tipsEn: 'Pair this hook with current trending audios to trigger the FYP algorithm.',
  },
  educational: {
    enTitle: 'educational and informative',
    amTitle: 'ትምህርታዊ',
    amHooks: (t) => [
      `ይህን 1 ቀላል ዘዴ ተጠቅማችሁ ውጤት አግኙ! 💡`,
      `ስለ ${t} ማወቅ ያለባችሁ 3 ወሳኝ ነጥቦች 📚`,
      `ብዙ ሰዎች የሚሳሳቱበት ነገር ግን ቀላል መፍትሔ ያለው ምሥጢር! 🧠`,
      `በቀላሉ እንዴት መሥራት እንደሚቻል ደረጃ በደረጃ ✍️`,
    ],
    enHooks: (t) => [
      `Here's how to master ${t} in under 60 seconds 💡`,
      `3 rules you need to know before you start 📚`,
      `The biggest mistake everyone makes with ${t} 🧠`,
      `Step-by-step breakdown you need to save right now ✍️`,
    ],
    ctasAm: [
      '📌 ለወደፊት እንዳይረሱ Save አድርጉት! ለሚፈልገው ሰው Share ያድርጉ 🔁',
      'ጥያቄ ካላችሁ ኮሜንት ላይ አስቀምጡልኝ! መልስ እሰጣችኋለሁ 💬',
    ],
    ctasEn: [
      'Bookmark this video for later 📌 Share with someone who needs this 🔁',
      'Drop your questions in the comments and I will reply! 💬',
    ],
    tipsAm: 'በቪዲዮው ላይ ጽሑፍ በንዑስ ርዕስ (subtitles) መልክ በማስቀመጥ ተደራሽነቱን በእጥፍ ያሳድጉ።',
    tipsEn: 'Adding on-screen subtitles dramatically increases information retention on TikTok.',
  },
  funny: {
    enTitle: 'funny and humorous',
    amTitle: 'አስቂኝ',
    amHooks: (t) => [
      `ማን ነው እንዲህ ሆኖ የሚያውቅ? 😂🤦‍♂️`,
      `ስለ ${t} ሳስብ ሁሌ የሚገርመኝ ነገር 🤣`,
      `ይህን አይተው ካልሳቁ እኔ ተጠያቂ አይደለሁም! 💀`,
      `ይህማ ሌላ ደረጃ ነው! 😭`,
    ],
    enHooks: (t) => [
      `I was NOT expecting that to happen 💀😂`,
      `Why is this 100% accurate? 😭`,
      `Nobody can watch this with a straight face 🤣`,
      `The reality of ${t} nobody prepared me for 🤦‍♂️`,
    ],
    ctasAm: [
      'ኮሜንት ላይ ሳቃችሁን አስቀምጡት 😂👇 ጓደኛችሁን Tag አድርጉ!',
      'ሼር ማድረጉን እንዳትረሱ! 🔁🤣',
    ],
    ctasEn: [
      'Tag your bestie right now 😂👇',
      'Comment your funniest reaction below! 💀',
    ],
    tipsAm: 'ቪዲዮው ከመጀመሩ በፊት የሚስቅ ወይም የሚያስደንቅ የፊት ገጽታ (Thumbnail) ያስቀምጡ።',
    tipsEn: 'Fast-paced editing with unexpected comedic timing keeps viewers watching in loop.',
  },
  motivational: {
    enTitle: 'motivational and inspiring',
    amTitle: 'አነቃቂ',
    amHooks: (t) => [
      `ዛሬ ተስፋ የቆረጣችሁ ሰዎች ይህን ስሙ! ✨`,
      `ሕይወትህን የሚቀይር የ30 ሰከንድ መልዕክት 🦁`,
      `አትቁም! የዛሬው ጥረት የነገው ድል ነው 💪`,
      `ይህ ቃል ለአንተ/ለአንቺ የተላከ ነው 🌟`,
    ],
    enHooks: (t) => [
      `Whoever needs to hear this today — this is your sign ✨`,
      `Don't give up. The breakthrough is closer than you think 🦁`,
      `30 seconds that will shift your mindset forever 💪`,
      `Remember why you started 🔥`,
    ],
    ctasAm: [
      '❤️ ለሚወዱት ሰው ይህን መልዕክት ያጋሩ! እራስዎን አበረታቱ 💪',
      'አሜን ካላችሁ ወይም ከተስማማችሁ ኮሜንት ላይ ❤️ አስቀምጡ!',
    ],
    ctasEn: [
      'Type "YES" if you claim this energy today! ❤️',
      'Share this with someone who needs motivation right now 🌟',
    ],
    tipsAm: 'ረጋ ያለ አነቃቂ የጀርባ ሙዚቃ እና ጥራት ያለው የድምፅ አነጋገር ይጠቀሙ።',
    tipsEn: 'Use inspirational ambient music to deepen emotional resonance with viewers.',
  },
  dramatic: {
    enTitle: 'dramatic and emotional',
    amTitle: 'ስሜታዊ',
    amHooks: (t) => [
      `የሆነውን ነገር ሳስብ አሁንም ያመኛል... 💔`,
      `እስከ መጨረሻው ካላያችሁት አይገባችሁም ⏳`,
      `ይህንን ለማንም ተናግሬ አላውቅም ነበር... 🤫`,
      `በሕይወቴ ትልቁን ትምህርት ያገኘሁበት ቀን 🥀`,
    ],
    enHooks: (t) => [
      `I never thought I would share this publicly... 💔`,
      `Wait for the plot twist at the end ⏳`,
      `The moment everything changed forever 🥀`,
      `This hit way harder than it should have 🥺`,
    ],
    ctasAm: [
      'እስከ መጨረሻው አይታችሁ ከሆነ ሀሳባችሁን አካፍሉኝ 💬💔',
      'Save አድርጉት እና አዳምጡት 📌',
    ],
    ctasEn: [
      'Did you see that coming? Let me know in the comments 💬',
      'Save this so you never forget 📌',
    ],
    tipsAm: 'ተመልካቾች እስከ መጨረሻው እንዲቆዩ የሚያደርግ የጉጉት ስሜት (suspense) ፍጠሩ።',
    tipsEn: 'Hold back the emotional climax until the final 5 seconds to maximize completion rate.',
  },
};

function sanitizeTag(word: string): string {
  const clean = word.replace(/[^\p{L}\p{N}_]/gu, '');
  return clean ? `#${clean}` : '';
}

function buildHashtags(topic: string, keywords: string[], language: string): string[] {
  const baseViral = ['#fyp', '#foryou', '#viral', '#trending', '#foryoupage', '#tiktok'];
  const baseAmharic = ['#ethiopian_tik_tok', '#habeshatiktok', '#አማርኛ', '#ኢትዮጵያ', '#ethiopia', '#habesha'];

  const customKeywordsTags = keywords
    .map(sanitizeTag)
    .filter(Boolean);

  const topicWords = topic
    .split(/\s+/)
    .map(sanitizeTag)
    .filter((t) => t.length > 3)
    .slice(0, 3);

  let list: string[] = [];

  if (language === 'amharic') {
    list = [
      ...baseAmharic,
      ...customKeywordsTags,
      ...topicWords,
      '#አዲስአበባ',
      '#ቫይራል',
      '#fyp',
      '#viral',
      '#ethiopian_tiktok',
    ];
  } else if (language === 'english') {
    list = [
      ...baseViral,
      ...customKeywordsTags,
      ...topicWords,
      '#viralvideo',
      '#fypage',
      '#contentcreator',
      '#explore',
    ];
  } else {
    // Amharic (default)
    list = [
      ...baseAmharic,
      ...baseViral,
      ...customKeywordsTags,
      ...topicWords,
      '#አዲስአበባ',
      '#ቫይራል',
      '#fyp',
      '#viral',
      '#ethiopian_tiktok',
    ];
  }

  // Remove duplicates
  return Array.from(new Set(list)).slice(0, 16);
}

function generatePackages(
  topic: string,
  vibe: string,
  keywords: string[],
  language: string,
  count: number
): CaptionPackage[] {
  const cfg = vibeConfig[vibe] || vibeConfig['any'];
  const kwStr = keywords.length > 0 ? keywords.join(', ') : topic;

  const amHooks = cfg.amHooks(topic, kwStr);
  const enHooks = cfg.enHooks(topic, kwStr);

  const packages: CaptionPackage[] = [];

  for (let i = 0; i < count; i++) {
    const hookAm = amHooks[i % amHooks.length];
    const hookEn = enHooks[i % enHooks.length];
    const ctaAm = cfg.ctasAm[i % cfg.ctasAm.length];
    const ctaEn = cfg.ctasEn[i % cfg.ctasEn.length];

    let hook = '';
    let caption = '';

    if (language === 'english') {
      hook = hookEn;
      caption = `${hookEn}\n\nEverything you need to know about ${topic}. Watch until the end!\n\n${ctaEn}`;
    } else {
      // Amharic (default)
      hook = hookAm;
      caption = `${hookAm}\n\nስለ ${topic} ወሳኝ መረጃ! ቪዲዮውን እስከ መጨረሻው ይመልከቱ።\n\n${ctaAm}`;
    }

    const tags = buildHashtags(topic, keywords, language);
    const fullCaption = `${caption}\n\n${tags.join(' ')}`;
    const charCount = fullCaption.length;
    const baseScore = 78 + (i % 3) * 6;
    const seoScore = Math.min(98, Math.max(68, baseScore));

    packages.push({
      id: i + 1,
      hook,
      caption,
      hashtags: tags,
      fullCaption,
      charCount,
      seoScore,
      tip: language === 'english' ? cfg.tipsEn : cfg.tipsAm,
    });
  }

  return packages;
}

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request' }, { status: 400 });
    }

    const topic: string = (body?.topic || '').trim();
    const vibe: string = (body?.vibe || 'any').toLowerCase();
    const keywords: string[] = (body?.keywords || '')
      .split(',')
      .map((k: string) => k.trim())
      .filter(Boolean);
    const language: string = (body?.language || 'amharic').toLowerCase() === 'english' ? 'english' : 'amharic';
    const count: number = Math.min(Math.max(parseInt(body?.count || '3', 10), 1), 5);

    if (!topic) {
      return NextResponse.json({ error: 'Video topic is required' }, { status: 400 });
    }

    const packages = generatePackages(topic, vibe, keywords, language, count);

    return NextResponse.json({
      success: true,
      packages,
      source: 'smart-engine',
      count: packages.length,
    });
  } catch (err: any) {
    console.error('TikTok generator error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Generation failed' },
      { status: 500 }
    );
  }
}
