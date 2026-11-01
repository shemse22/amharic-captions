import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db';
import { getSessionUser, isAdminUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const { id } = await context.params;
    const postId = parseInt(id, 10);
    const post = await dbService.getBlogPostById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, post });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch post' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const { id } = await context.params;
    const postId = parseInt(id, 10);

    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : undefined;
    const excerpt = typeof body.excerpt === 'string' ? body.excerpt.trim() : undefined;
    const content = typeof body.content === 'string' ? body.content.trim() : undefined;
    const category = typeof body.category === 'string' ? body.category.trim() : undefined;
    const tags: string[] | undefined = body.tags !== undefined
      ? Array.isArray(body.tags)
        ? body.tags.filter((tag: unknown): tag is string => typeof tag === 'string').map((tag: string) => tag.trim()).filter(Boolean)
        : typeof body.tags === 'string'
        ? body.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
        : []
      : undefined;

    if (title === undefined || !title || excerpt === undefined || content === undefined || !content) {
      return NextResponse.json(
        { error: 'Title, meta description, and article content are required.' },
        { status: 400 }
      );
    }
    if (title.length > 90) {
      return NextResponse.json({ error: 'The article title must be 90 characters or fewer.' }, { status: 400 });
    }
    if (excerpt.length < 50 || excerpt.length > 160) {
      return NextResponse.json(
        { error: 'The meta description must be between 50 and 160 characters.' },
        { status: 400 }
      );
    }
    const authorName = typeof body.authorName === 'string' ? body.authorName.trim() : undefined;
    if (
      [title, excerpt, content, category || '', authorName || '', ...(tags || [])]
        .some((value) => /[\u1200-\u137F]/.test(value))
    ) {
      return NextResponse.json(
        { error: 'Public blog content must be written in English.' },
        { status: 400 }
      );
    }

    const slug = body.slug !== undefined && typeof body.slug === 'string'
      ? body.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : undefined;
    if (slug !== undefined && (!slug || slug.length > 80)) {
      return NextResponse.json(
        { error: 'Use an English URL slug between 1 and 80 characters.' },
        { status: 400 }
      );
    }

    const updated = await dbService.updateBlogPost(postId, {
      title,
      ...(slug !== undefined && { slug }),
      excerpt,
      content,
      ...(body.coverImage !== undefined && { coverImage: body.coverImage }),
      ...(category !== undefined && { category }),
      ...(tags !== undefined && { tags }),
      ...(body.status !== undefined && { status: body.status }),
      ...(authorName !== undefined && { authorName }),
    });

    if (!updated) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Post "${updated.title}" successfully updated!`,
      post: updated,
    });
  } catch (err: any) {
    console.error('Admin update blog error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const { id } = await context.params;
    const postId = parseInt(id, 10);

    const success = await dbService.deleteBlogPost(postId);
    if (!success) {
      return NextResponse.json({ error: 'Post not found or could not be deleted' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Post #${postId} successfully deleted.`,
    });
  } catch (err: any) {
    console.error('Admin delete blog error:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete post' }, { status: 500 });
  }
}
