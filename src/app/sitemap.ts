import type { MetadataRoute } from 'next';
import { dbService } from '@/lib/db';

const publicPaths = [
  '/',
  '/about',
  '/blog',
  '/contact',
  '/pricing',
  '/studio',
  '/tools/tiktok-generator',
  '/1080p-video-burner',
  '/subtitle-animations',
];

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://bgern.com').replace(/\/+$/, '');
  const posts = await dbService.getBlogPosts({ status: 'published' });

  const pages: MetadataRoute.Sitemap = publicPaths.map((pathname) => ({
    url: `${baseUrl}${pathname}`,
    changeFrequency: pathname === '/blog' ? 'daily' : 'weekly',
    priority:
      pathname === '/'
        ? 1
        : pathname === '/blog' || pathname === '/studio'
          ? 0.9
          : 0.8,
  }));

  const articles: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt || post.publishedAt || post.createdAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...pages, ...articles];
}
