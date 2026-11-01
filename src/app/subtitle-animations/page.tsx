import type { Metadata } from 'next';
import SeoProductLanding from '@/components/SeoProductLanding';

const title = 'Animated Amharic Subtitle Styles for Video';
const description =
  'Preview and customize animated Amharic caption styles in Bgern Studio, then export subtitles with your finished video.';

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    'animated Amharic subtitles',
    'Amharic caption styles for video',
    'Ethiopic animated captions',
    'custom subtitle animation editor',
  ],
  alternates: { canonical: 'https://bgern.com/subtitle-animations' },
  openGraph: {
    title,
    description,
    url: 'https://bgern.com/subtitle-animations',
    siteName: 'Bgern',
    type: 'website',
  },
  twitter: { card: 'summary', title, description },
};

export default function SubtitleAnimationsPage() {
  return (
    <SeoProductLanding
      path="/subtitle-animations"
      title={title}
      description={description}
      intro="Give Amharic captions a consistent visual style with Bgern Studio. Preview subtitle treatments on your video, refine the text and timing, and export the project when it is ready."
      benefits={[
        {
          title: 'Style captions for your video',
          description:
            'Adjust text appearance and apply the animation options available in the Studio to match the pace and tone of your content.',
        },
        {
          title: 'Check Ethiopic text in context',
          description:
            'Preview captions over your footage so you can spot difficult line breaks, low contrast, or text that obscures important details.',
        },
        {
          title: 'Edit and review in one place',
          description:
            'Make changes to caption wording and timing in the editor, then preview the updated result before exporting.',
        },
      ]}
      steps={[
        'Sign in to Bgern Studio and upload your video.',
        'Generate captions or enter your transcript and timing.',
        'Choose an available caption style and preview it over the video.',
        'Review readability and timing, then export the video or subtitle file.',
      ]}
      faqs={[
        {
          question: 'Can I preview animated subtitles before exporting?',
          answer:
            'Yes. Bgern Studio includes a video preview so you can review the caption styling and timing before exporting.',
        },
        {
          question: 'Can I customize the appearance of Amharic captions?',
          answer:
            'The Studio provides caption styling controls for text appearance and animation. The available options can be checked directly in the editor.',
        },
        {
          question: 'Do animated captions require uploading a video?',
          answer:
            'To preview captions on your own footage, upload a video in Bgern Studio. Sign in is required before media uploads.',
        },
      ]}
      relatedHref="/1080p-video-burner"
      relatedLabel="Learn about video export"
    />
  );
}
