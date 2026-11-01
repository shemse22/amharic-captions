import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Bgern Amharic AI Studio',
  description:
    'Learn how Bgern protects your privacy, personal data, and uploaded video files. Transparent data protection policies.',
  alternates: {
    canonical: 'https://bgern.com/privacy',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

