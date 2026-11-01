import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || searchParams.get('q') || undefined;

    const posts = await dbService.getBlogPosts({
      status: 'published',
      category,
      search,
    });

    return NextResponse.json({
      success: true,
      posts,
      total: posts.length,
    });
  } catch (err: any) {
    console.error('Blog listing error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

