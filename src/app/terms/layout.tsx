import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Bgern Amharic AI Studio',
  description:
    'Review the terms of service and usage conditions for the Bgern AI Amharic subtitle generator, minutes purchases, and account usage.',
  alternates: {
    canonical: 'https://bgern.com/terms',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

