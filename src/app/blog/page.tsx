import type { Metadata } from 'next';
import { dbService } from '@/lib/db';
import BlogFeedClient from './BlogFeedClient';

export const metadata: Metadata = {
  title: 'Creator Guides & Video Captioning Insights',
  description:
    'Explore practical guides to Amharic captions, accessible video editing, creator workflows, and publishing for TikTok, YouTube, and Reels.',
  alternates: {
    canonical: 'https://bgern.com/blog',
  },
};

export default async function BlogPage() {
  const posts = await dbService.getBlogPosts({ status: 'published' });

  return <BlogFeedClient posts={posts} />;
}
