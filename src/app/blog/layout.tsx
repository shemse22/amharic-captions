import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Creator Guides & Video Captioning Insights',
  description:
    'Practical guides to preparing, reviewing, and styling Amharic captions, using transcription tools responsibly, and publishing accessible videos.',
  keywords: [
    'Amharic video editing',
    'Amharic captions',
    'Ethiopian video creators',
    'Amharic speech to text',
    'how to add Amharic subtitles',
    'Bgern creator guides',
  ],
  alternates: {
    canonical: 'https://bgern.com/blog',
  },
  openGraph: {
    title: 'Creator Guides & Video Captioning Insights | Bgern',
    description:
      'Practical guidance on Amharic captioning, video editing, transcription, and accessible publishing for creators.',
    url: 'https://bgern.com/blog',
    siteName: 'Bgern Amharic AI Subtitles',
    type: 'website',
    images: [
      {
        url: '/logo-1024.png',
        width: 1024,
        height: 1024,
        alt: 'Bgern creator guides and video captioning insights',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Creator Guides & Video Captioning Insights | Bgern',
    description:
      'Practical guidance on Amharic captioning, video editing, transcription, and accessible publishing for creators.',
    images: ['/logo-1024.png'],
  },
};

const blogJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Bgern Creator Guides',
  description:
    'Practical articles and tutorials on Amharic speech-to-text, video captioning, and content creation.',
  url: 'https://bgern.com/blog',
  publisher: {
    '@type': 'Organization',
    name: 'Bgern Studio',
    url: 'https://bgern.com',
    logo: 'https://bgern.com/logo.png',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      {children}
    </>
  );
}
