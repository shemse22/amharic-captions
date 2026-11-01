import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db';
import { getSessionUser, isAdminUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const { id } = await context.params;
    const videoId = parseInt(id, 10);
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Content does not meet community broadcast guidelines';

    const updated = await dbService.updateVideoStatus(videoId, 'REJECTED', reason);
    if (!updated) {
      return NextResponse.json({ error: 'Video project not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Video #${videoId} rejected. Reason: ${reason}`,
      video: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Video rejection failed' }, { status: 500 });
  }
}

