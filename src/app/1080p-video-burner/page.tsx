import type { Metadata } from 'next';
import SeoProductLanding from '@/components/SeoProductLanding';

const title = 'Burn Amharic Subtitles into 1080p Videos Online';
const description =
  'Add reviewed Amharic captions to your video and export a subtitled MP4 in 1080p or 720p with Bgern Studio.';

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    'burn Amharic subtitles into video',
    '1080p Amharic subtitle burner',
    'Amharic video caption export',
    'online subtitle burner Ethiopia',
  ],
  alternates: { canonical: 'https://bgern.com/1080p-video-burner' },
  openGraph: {
    title,
    description,
    url: 'https://bgern.com/1080p-video-burner',
    siteName: 'Bgern',
    type: 'website',
  },
  twitter: { card: 'summary', title, description },
};

export default function VideoBurnerPage() {
  return (
    <SeoProductLanding
      path="/1080p-video-burner"
      title={title}
      description={description}
      intro="Create readable, timed Amharic captions, review them against your video, and export a finished MP4 from Bgern Studio. The in-browser editor also provides a 720p export option and subtitle-file exports."
      benefits={[
        {
          title: 'Review before exporting',
          description:
            'Check the transcript, edit caption text and timing, and preview the result before rendering the final video.',
        },
        {
          title: 'Choose an export size',
          description:
            'Export a captioned video in 1080p or 720p. Select the available frame-rate option in the Studio export menu.',
        },
        {
          title: 'Keep captions readable',
          description:
            'Adjust Ethiopic text styling and placement in the editor, then watch the rendered video to verify the result.',
        },
      ]}
      steps={[
        'Sign in to Bgern and open Studio.',
        'Upload a video and generate or edit the Amharic captions.',
        'Review the subtitle timing, wording, and placement in the preview.',
        'Choose 1080p or 720p from Export and save the completed MP4.',
      ]}
      faqs={[
        {
          question: 'Can I burn Amharic subtitles into a video online?',
          answer:
            'Yes. Bgern Studio lets you create or edit Amharic captions in the browser and export a captioned MP4. Sign in is required to upload your own media.',
        },
        {
          question: 'What video export resolutions are available?',
          answer:
            'The Studio export menu offers 1080p and 720p video exports. Review the current export options in the editor before rendering.',
        },
        {
          question: 'Can I download subtitle files instead of a burned-in video?',
          answer:
            'Bgern Studio also supports subtitle-file exports. Use the export menu to choose the format available for your project.',
        },
      ]}
      relatedHref="/studio"
      relatedLabel="Explore the caption editor"
    />
  );
}
