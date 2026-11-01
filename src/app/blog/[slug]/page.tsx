import type { Metadata } from 'next';
import { dbService, type BlogPostRecord } from '@/lib/db';
import BlogPostClient from './BlogPostClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function getPostUrl(slug: string): string {
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://bgern.com').replace(/\/+$/, '');
  return `${siteUrl}/blog/${slug}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const posts = await dbService.getBlogPosts({ status: 'published' });
  const post = posts.find((item) => item.slug === slug);

  if (!post) {
    return {
      title: 'Article Not Found | Bgern',
      description: 'The requested article could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://bgern.com').replace(/\/+$/, '');
  const articleUrl = getPostUrl(post.slug);
  const coverImage = post.coverImage
    ? (post.coverImage.startsWith('http') ? post.coverImage : `${siteUrl}${post.coverImage}`)
    : `${siteUrl}/hero.png`;
  const description = post.excerpt || post.title;

  return {
    title: post.title,
    description,
    keywords: post.tags?.length ? post.tags : ['Amharic captions', 'Video editing', 'Bgern'],
    authors: [{ name: post.authorName || 'Bgern Editorial Team' }],
    openGraph: {
      title: post.title,
      description,
      url: articleUrl,
      siteName: 'Bgern',
      type: 'article',
      publishedTime: post.publishedAt || post.createdAt,
      modifiedTime: post.updatedAt,
      authors: [post.authorName || 'Bgern Editorial Team'],
      tags: post.tags,
      images: [{ url: coverImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [coverImage],
    },
    alternates: {
      canonical: articleUrl,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await dbService.getBlogPostBySlug(slug);

  let related: BlogPostRecord[] = [];
  if (post) {
    const allPosts = await dbService.getBlogPosts({ status: 'published' });
    related = allPosts
      .filter((item) => item.id !== post.id && (item.category === post.category || item.tags.some((tag) => post.tags.includes(tag))))
      .slice(0, 3);
  }

  const articleUrl = post ? getPostUrl(post.slug) : undefined;
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://bgern.com').replace(/\/+$/, '');
  const structuredData = post && articleUrl
    ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        image: post.coverImage
          ? (post.coverImage.startsWith('http') ? post.coverImage : `${siteUrl}${post.coverImage}`)
          : `${siteUrl}/hero.png`,
        datePublished: post.publishedAt || post.createdAt,
        dateModified: post.updatedAt,
        author: {
          '@type': 'Organization',
          name: post.authorName || 'Bgern Editorial Team',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Bgern',
          url: siteUrl,
          logo: `${siteUrl}/logo.png`,
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': articleUrl,
        },
        articleSection: post.category,
        keywords: post.tags,
        inLanguage: 'en',
        wordCount: post.content.trim().split(/\s+/).length,
      }
    : null;

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
          }}
        />
      )}
      <BlogPostClient post={post} related={related} />
    </>
  );
}
