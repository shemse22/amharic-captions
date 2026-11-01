import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const videoId = parseInt(id, 10);
    const user = await getSessionUser();

    if (user && user.role !== 'ADMIN' && !user.isAdmin) {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Does not meet guidelines';

    const updated = await dbService.updateVideoStatus(videoId, 'REJECTED', reason);
    if (!updated) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, video: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Rejection failed' }, { status: 500 });
  }
}

