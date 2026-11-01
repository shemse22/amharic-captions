import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Bgern — Support & Creator Inquiries | Ethiopia',
  description:
    'Need help with your Amharic captions or Telebirr account top-up? Contact the Bgern support team via Telegram, email, or in Addis Ababa, Ethiopia.',
  keywords: [
    'Contact Bgern',
    'Bgern Telegram support',
    'Ethiopian creator support',
    'Amharic AI support',
  ],
  alternates: {
    canonical: 'https://bgern.com/contact',
  },
  openGraph: {
    title: 'Contact Bgern — Support & Creator Inquiries',
    description: 'Reach out to the Bgern team for questions, Telebirr support, and custom integrations.',
    url: 'https://bgern.com/contact',
    siteName: 'Bgern Amharic AI Subtitles',
    type: 'website',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

