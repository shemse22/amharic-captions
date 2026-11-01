import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db';
import { getSessionUser, isAdminUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const query = searchParams.get('q')?.toLowerCase()?.trim();

    let videos = await dbService.listVideos();

    if (statusFilter && statusFilter !== 'all') {
      videos = videos.filter((v) => v.status === statusFilter);
    }

    if (query) {
      videos = videos.filter(
        (v) =>
          v.title?.toLowerCase()?.includes(query) ||
          v.userEmail?.toLowerCase()?.includes(query)
      );
    }

    return NextResponse.json({
      success: true,
      count: videos.length,
      videos,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to list videos' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('id');
    if (!videoId) {
      return NextResponse.json({ error: 'id query param required' }, { status: 400 });
    }

    const success = await dbService.deleteVideoProject(parseInt(videoId, 10));
    return NextResponse.json({ success, message: 'Video deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete video' }, { status: 500 });
  }
}


