import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }

    const post = await dbService.getBlogPostBySlug(slug);
    if (!post) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Fetch related articles in same category
    const allPosts = await dbService.getBlogPosts({ status: 'published' });
    const related = allPosts
      .filter((p) => p.id !== post.id && (p.category === post.category || p.tags.some((t) => post.tags.includes(t))))
      .slice(0, 3);

    return NextResponse.json({
      success: true,
      post,
      related,
    });
  } catch (err: any) {
    console.error('Blog slug error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

