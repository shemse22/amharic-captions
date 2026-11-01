import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Bgern — Pioneers in Amharic AI Speech & Video Technology',
  description:
    'Learn how Bgern is empowering Ethiopian creators, educators, and brands with high-accuracy Amharic speech-to-text, animated Ge\'ez captions, and Telebirr integration.',
  keywords: [
    'About Bgern',
    'Ethiopian AI startup',
    'Amharic speech recognition technology',
    'Amharic video editing team',
    'Addis Ababa AI',
  ],
  alternates: {
    canonical: 'https://bgern.com/about',
  },
  openGraph: {
    title: 'About Bgern — Pioneers in Amharic AI Speech & Video Technology',
    description:
      'Empowering Ethiopian creators with AI-driven Amharic captions, video burning, and local payment integration.',
    url: 'https://bgern.com/about',
    siteName: 'Bgern Amharic AI Subtitles',
    type: 'website',
    images: [
      {
        url: '/logo-1024.png',
        width: 1024,
        height: 1024,
        alt: 'About Bgern Studio',
      },
    ],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

