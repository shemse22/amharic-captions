import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Amharic Caption Pricing & Plans in Ethiopia',
  description:
    'Compare Bgern caption and transcription plans in Ethiopian birr. See available minutes, plan features, and payment options including Telebirr and CBE.',
  alternates: {
    canonical: 'https://bgern.com/pricing',
  },
  openGraph: {
    title: 'Amharic Caption Pricing & Plans in Ethiopia | Bgern',
    description:
      'Compare available Bgern transcription minutes and plan features, with local Telebirr and CBE payment options.',
    url: 'https://bgern.com/pricing',
    siteName: 'Bgern',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Amharic Caption Pricing & Plans in Ethiopia | Bgern',
    description:
      'Compare available Bgern transcription minutes and plan features, with local Telebirr and CBE payment options.',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
