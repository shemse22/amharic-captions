import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  const searchParams = request.nextUrl.searchParams;
  const scope = searchParams.get('scope');

  // If admin requesting all videos
  if (scope === 'all' && (user?.role === 'ADMIN' || user?.isAdmin)) {
    const allVideos = await dbService.listVideos();
    return NextResponse.json({ videos: allVideos });
  }

  // Return user's videos (or user 1 / all recent 7-day videos if guest)
  const userId = user?.id || (searchParams.get('userId') ? Number(searchParams.get('userId')) : undefined);
  const videos = await dbService.listVideos(userId);
  return NextResponse.json({ videos });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Sign in before saving videos.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, title, videoUrl, durationSec, subtitlesJson, status } = body;

    const userId = user.id;

    // If existing video ID is specified, update subtitles and duration
    if (id) {
      const updated = await dbService.updateVideoSubtitles(Number(id), subtitlesJson, durationSec);
      if (updated) {
        return NextResponse.json({ video: updated, success: true });
      }
    }

    // If same videoUrl exists for user, update it
    if (videoUrl) {
      const existing = (await dbService.listVideos(userId)).find((v) => v.videoUrl === videoUrl);
      if (existing) {
        const updated = await dbService.updateVideoSubtitles(existing.id, subtitlesJson, durationSec);
        if (updated) {
          return NextResponse.json({ video: updated, success: true });
        }
      }
    }

    const video = await dbService.createVideoProject({
      userId,
      title: title || 'Untitled Video',
      videoUrl,
      durationSec: durationSec || 0,
      subtitlesJson,
      status: status || 'APPROVED',
    });

    if (video.status === 'PENDING_APPROVAL') {
      try {
        await dbService.createNotification({
          targetRole: 'ADMIN',
          type: 'VIDEO_PENDING',
          title: 'New video needs approval',
          message: `${video.userEmail || `User #${video.userId}`} submitted "${video.title}" for approval.`,
          data: {
            videoId: video.id,
            videoTitle: video.title,
            userEmail: video.userEmail,
          },
        });
      } catch (notificationError) {
        console.warn('Failed to notify administrators about pending video:', notificationError);
      }
    }

    return NextResponse.json({ video, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to submit video' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
    if (!id) {
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 });
    }

    const success = await dbService.deleteVideoProject(id, user?.isAdmin ? undefined : (user?.id || undefined));
    if (!success) {
      return NextResponse.json({ error: 'Video not found or permission denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete video' }, { status: 500 });
  }
}
