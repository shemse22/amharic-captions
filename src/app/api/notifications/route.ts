import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db';
import { getSessionUser, isAdminUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let user = await getSessionUser();
    const { searchParams } = new URL(req.url);

    if (!user) {
      const queryUserId = searchParams.get('userId');
      const queryEmail = searchParams.get('userEmail');
      if (queryUserId) {
        user = await dbService.findUserById(Number(queryUserId));
      } else if (queryEmail) {
        user = await dbService.findUserByEmail(queryEmail);
      }
    }

    if (!user) {
      return NextResponse.json({
        success: true,
        unreadCount: 0,
        notifications: [],
      });
    }

    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const scope = searchParams.get('scope') || 'user';

    const isAdmin = isAdminUser(user);
    // Only return ADMIN notifications if explicitly requested with scope=admin by an authenticated admin
    const targetRole: 'ADMIN' | 'USER' = (scope === 'admin' && isAdmin) ? 'ADMIN' : 'USER';

    const filter = {
      userId: user.id,
      targetRole,
      unreadOnly,
      limit,
    };

    const notifications = await dbService.listNotifications(filter);
    const unreadCount = await dbService.getUnreadNotificationsCount({
      userId: user.id,
      targetRole,
    });

    return NextResponse.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let user = await getSessionUser();

    if (!user && (body.userId || body.userEmail)) {
      if (body.userId) {
        user = await dbService.findUserById(Number(body.userId));
      } else if (body.userEmail) {
        user = await dbService.findUserByEmail(body.userEmail);
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, markAll, scope } = body;
    const isAdmin = isAdminUser(user);
    const targetRole: 'ADMIN' | 'USER' = (scope === 'admin' && isAdmin) ? 'ADMIN' : 'USER';

    if (markAll) {
      const count = await dbService.markAllNotificationsAsRead({
        userId: user.id,
        targetRole,
      });
      return NextResponse.json({ success: true, count });
    }

    if (id) {
      const success = await dbService.markNotificationAsRead(Number(id), user.id);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: 'Missing id or markAll parameter' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
