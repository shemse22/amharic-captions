import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Amharic Video Caption Studio — In-Browser Editor & Burner',
  description:
    'Create, review, and style Amharic captions in an online video studio. Edit subtitle timing, customize Ethiopic text, and export captioned video or subtitle files.',
  keywords: [
    'Amharic subtitle studio',
    'Amharic video editor online',
    'burn Amharic subtitles into video',
    'Amharic SRT editor',
    'Ethiopian video captions app',
  ],
  alternates: {
    canonical: 'https://bgern.com/studio',
  },
  openGraph: {
    title: 'Amharic Video Caption Studio — In-Browser Editor & Burner | Bgern',
    description:
      'Create and edit Amharic captions in your browser, then export a captioned video or subtitle file from Bgern Studio.',
    url: 'https://bgern.com/studio',
    siteName: 'Bgern Amharic AI Subtitles',
    type: 'website',
    images: [
      {
        url: '/logo-1024.png',
        width: 1024,
        height: 1024,
        alt: 'Bgern Caption Studio',
      },
    ],
  },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
