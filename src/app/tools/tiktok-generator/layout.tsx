import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Amharic TikTok Caption & Hashtag Generator',
  description:
    'Generate Amharic or English TikTok captions and hashtag ideas from a topic. Choose a tone, add keywords, and copy the suggestions into your post.',
  keywords: [
    'Amharic TikTok captions',
    'Amharic TikTok subtitles generator',
    'Ethiopian TikTok video editor',
    'Amharic social media captions',
    'TikTok caption ideas in Amharic',
    'TikTok hashtag ideas for Ethiopian creators',
  ],
  alternates: {
    canonical: 'https://bgern.com/tools/tiktok-generator',
  },
  openGraph: {
    title: 'Amharic TikTok Caption & Hashtag Generator | Bgern',
    description:
      'Generate Amharic or English TikTok captions and hashtag ideas from a topic, tone, and keywords.',
    url: 'https://bgern.com/tools/tiktok-generator',
    siteName: 'Bgern',
    type: 'website',
    images: [
      {
        url: '/logo-1024.png',
        width: 1024,
        height: 1024,
        alt: 'Bgern TikTok Caption Generator',
      },
    ],
  },
};

export default function TikTokGeneratorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
