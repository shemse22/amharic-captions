import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db';
import { getSessionUser, isAdminUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const status = (searchParams.get('status') as any) || 'all';

    const posts = await dbService.getBlogPosts({
      status,
      category,
      search,
    });

    return NextResponse.json({
      success: true,
      posts,
      total: posts.length,
    });
  } catch (err: any) {
    console.error('Admin blog list error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const body = await request.json();
    const { title, slug, excerpt, content, coverImage, category, tags, status } = body;
    const normalizedTitle = typeof title === 'string' ? title.trim() : '';
    const normalizedExcerpt = typeof excerpt === 'string' ? excerpt.trim() : '';
    const normalizedContent = typeof content === 'string' ? content.trim() : '';
    const normalizedCategory = typeof category === 'string' ? category.trim() : 'Tips & Tricks';
    const normalizedTags: string[] = Array.isArray(tags)
      ? tags.filter((tag: unknown): tag is string => typeof tag === 'string').map((tag: string) => tag.trim()).filter(Boolean)
      : typeof tags === 'string'
      ? tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
      : [];

    if (!normalizedTitle) {
      return NextResponse.json({ error: 'Post title is required' }, { status: 400 });
    }
    if (normalizedTitle.length > 90) {
      return NextResponse.json({ error: 'The article title must be 90 characters or fewer.' }, { status: 400 });
    }
    if (!normalizedContent) {
      return NextResponse.json({ error: 'Post content is required' }, { status: 400 });
    }
    if (normalizedExcerpt.length < 50 || normalizedExcerpt.length > 160) {
      return NextResponse.json(
        { error: 'The meta description must be between 50 and 160 characters.' },
        { status: 400 }
      );
    }
    if ([normalizedTitle, normalizedExcerpt, normalizedContent, normalizedCategory, ...normalizedTags].some((value) => /[\u1200-\u137F]/.test(value))) {
      return NextResponse.json(
        { error: 'Public blog content must be written in English.' },
        { status: 400 }
      );
    }

    const normalizedSlug = (typeof slug === 'string' && slug.trim() ? slug : normalizedTitle)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (!normalizedSlug || normalizedSlug.length > 80) {
      return NextResponse.json(
        { error: 'Use an English URL slug between 1 and 80 characters.' },
        { status: 400 }
      );
    }

    const created = await dbService.createBlogPost({
      title: normalizedTitle,
      slug: normalizedSlug,
      excerpt: normalizedExcerpt,
      content: normalizedContent,
      coverImage: coverImage || '/podcast-preview.jpg',
      category: normalizedCategory,
      tags: normalizedTags,
      authorName: 'Bgern Editorial Team',
      authorAvatar: '/logo.png',
      status: status === 'draft' ? 'draft' : 'published',
    });

    return NextResponse.json({
      success: true,
      message: `Blog post "${created.title}" successfully ${created.status === 'published' ? 'published' : 'saved as draft'}!`,
      post: created,
    });
  } catch (err: any) {
    console.error('Admin create blog error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create blog post' }, { status: 500 });
  }
}
