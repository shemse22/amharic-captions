import type { Metadata, Viewport } from 'next';
import './globals.css';

const notoEthiopic = {
  variable: '--font-noto-ethiopic',
};

const plusJakarta = {
  variable: '--font-jakarta',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://bgern.com'),
  title: {
    default: 'Bgern — Amharic AI Subtitles & Caption Studio',
    template: '%s | Bgern AI Captions',
  },
  description:
    'Ethiopia\'s premier AI Amharic subtitle generator and video editor. Convert Amharic speech to text online, create viral captions for TikTok, YouTube, and Facebook, and download SRT/VTT or burn in 1080p. የአማርኛ ንዑስ ርዕስ በቀላሉ ይፍጠሩ።',
  applicationName: 'Bgern Amharic Captions',
  keywords: [
    // Highest-intent keywords
    'Amharic subtitle generator Ethiopia',
    'Amharic caption generator Ethiopia',
    'Amharic video editor',
    'Amharic video subtitle app',
    'Amharic subtitles online',
    'Amharic captions online',
    'Ethiopian Amharic subtitle generator',
    'Ethiopian video caption generator',
    'Amharic AI tools',
    'AI tools for Ethiopian creators',
    'Amharic content creator tools',
    'Amharic creator tools',
    // Long-tail keywords
    'how to add Amharic subtitles to a video',
    'how to generate Amharic subtitles automatically',
    'how to create Amharic captions for Facebook videos',
    'how to add Amharic captions to YouTube videos',
    'how to add Amharic subtitles to TikTok videos',
    'convert Amharic speech to text',
    'Amharic speech to text online',
    'Amharic audio to text',
    'Amharic video to text',
    'Amharic transcription online',
    'Amharic voice to text',
    'AI Amharic transcription',
    'automatic Amharic transcription',
    'Amharic SRT generator',
    'Amharic VTT generator',
    'download Amharic subtitles',
    'create SRT subtitles in Amharic',
    'Amharic subtitle maker online',
    'Amharic subtitle editor online',
    // Amharic vernacular keywords
    'የአማርኛ ንዑስ ርዕስ',
    'የአማርኛ ቪዲዮ ጽሑፍ',
    'የአማርኛ ድምፅ ወደ ጽሑፍ',
    'የአማርኛ ንዑስ ርዕስ ማመንጫ',
    'Telebirr payment captions',
    'CBE video editor',
  ],
  authors: [{ name: 'Bgern Studio', url: 'https://bgern.com' }],
  creator: 'Bgern Studio',
  publisher: 'Bgern Inc.',
  category: 'Multimedia & Video Production',
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'am_ET',
    alternateLocale: ['en_US'],
    url: 'https://bgern.com',
    siteName: 'Bgern Amharic AI Subtitles',
    title: 'Bgern — Amharic AI Subtitles & Caption Studio',
    description:
      'Generate viral Amharic captions in seconds. Burn into 1080p/720p videos with beautiful Ge\'ez typography.',
    images: [
      {
        url: '/logo-1024.png',
        width: 1024,
        height: 1024,
        alt: 'Bgern Amharic Caption Studio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bgern — Amharic AI Subtitles & Caption Studio',
    description:
      'Generate viral Amharic captions in seconds. Fast, low-bandwidth optimized for Ethiopia, with Telebirr and CBE support.',
    images: ['/logo-1024.png'],
    creator: '@bgern_studio',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/logo-160-icon.png', sizes: '160x160', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'format-detection': 'telephone=no',
  },
  verification: {
    google: 'u8H8DU6XBXmtliUjNxBUGVA3xsxGiLtEVWWfmXwF53k',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F3F5F6' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0F17' },
  ],
};

import { ThemeProvider } from '@/components/ThemeProvider';

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': 'https://bgern.com/#webapp',
      name: 'Bgern Amharic AI Captions',
      alternateName: 'Bgern Captions',
      url: 'https://bgern.com',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'All modern web browsers (Chrome, Safari, Edge, Firefox, iOS, Android)',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'ETB',
        description: 'Free tier with 10 free minutes upon Gmail signup.',
      },
      description:
        'Ethiopia\'s premier AI-powered Amharic caption and subtitle studio. Burn viral animated captions in Ge\'ez typography directly onto 1080p and 720p videos.',
      featureList: [
        'Automatic Amharic Speech-to-Text Transcription',
        '1080p / 720p Direct In-Browser Video Burning',
        'Authentic Ethiopic Font Library (Noto Sans, Abyssinica, Jiret, etc.)',
        'Custom Animations (Pop, Slide, Bounce, Karaoke Highlight)',
        'Telebirr & Commercial Bank of Ethiopia (CBE) Integration',
        'Export to SRT, VTT, and ASS',
      ],
      keywords:
        'Amharic subtitle generator Ethiopia, Amharic caption generator, Amharic video editor, Ethiopian Amharic subtitle generator, convert Amharic speech to text, Amharic transcription online',
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://bgern.com/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How to add Amharic subtitles to a video automatically?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sign up for free at Bgern.com, upload your video file (MP4, MOV, or WebM), and click Generate Captions. Bgern AI converts your Amharic speech to text with accurate Ge\'ez script timing in seconds. You can customize font styles and download your video in 1080p or download an SRT file.',
          },
        },
        {
          '@type': 'Question',
          name: 'How to create Amharic captions for TikTok, YouTube, and Facebook videos?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'In the Bgern Studio, select your target aspect ratio: 9:16 for TikTok, Instagram Reels, and YouTube Shorts, or 16:9 for widescreen YouTube and Facebook videos. Choose from animated styles like Pop, Up-Down bounce, or word-by-word pulse to boost viewer engagement.',
          },
        },
        {
          '@type': 'Question',
          name: 'How to convert Amharic speech and audio to text online?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Bgern provides state-of-the-art Amharic audio-to-text and video-to-text transcription powered by advanced Ethiopian speech recognition models. Upload your audio or video file to receive timestamped Ge\'ez text transcripts immediately.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I download SRT and VTT subtitles in Amharic?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Bgern allows instant export to SRT, WebVTT (.vtt), and ASS formats. You can upload these subtitle files directly to YouTube Studio, Facebook Video Manager, or import them into Adobe Premiere Pro and DaVinci Resolve.',
          },
        },
      ],
    },
    {
      '@type': 'Organization',
      '@id': 'https://bgern.com/#organization',
      name: 'Bgern Studio',
      url: 'https://bgern.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://bgern.com/logo.png',
      },
      sameAs: [
        'https://t.me/bgern_supportbot',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://bgern.com/#website',
      url: 'https://bgern.com',
      name: 'Bgern',
      publisher: {
        '@id': 'https://bgern.com/#organization',
      },
      inLanguage: ['am-ET', 'en-US'],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="am"
      suppressHydrationWarning
      className={`h-full antialiased ${notoEthiopic.variable} ${plusJakarta.variable}`}
    >
      <head>
        {/* Preconnect to external font and asset domains for low latency */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://ui-avatars.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&family=Montserrat:wght@400;600;700;800;900&family=Inter:wght@400;600;700;800&family=Roboto:wght@400;500;700;900&display=swap"
        />

        {/* Structured Data (JSON-LD) for Search Engine Crawlers */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}