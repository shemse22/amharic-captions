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
    const query = searchParams.get('q')?.toLowerCase()?.trim();

    let users = await dbService.listUsers();
    if (query) {
      users = users.filter(
        (u) =>
          u.email.toLowerCase().includes(query) ||
          u.name.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({ success: true, count: users.length, users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to list users' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, creditsDelta, minutesDelta, toggleRole } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (toggleRole) {
      const updated = await dbService.toggleUserRole(Number(userId));
      if (!updated) {
        return NextResponse.json(
          { error: 'Only the authorized owner account may have admin privileges.' },
          { status: 403 }
        );
      }
      return NextResponse.json({
        success: true,
        user: updated,
        message: 'Admin privileges are restricted to the authorized owner account.',
      });
    }

    if (creditsDelta !== undefined || minutesDelta !== undefined) {
      const updated = await dbService.updateUserCredits(
        Number(userId),
        Number(creditsDelta) || 0,
        Number(minutesDelta) || 0
      );
      return NextResponse.json({
        success: true,
        user: updated,
        message: 'User balance adjusted successfully',
      });
    }

    return NextResponse.json({ error: 'No update action specified' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');
    if (!userId) {
      return NextResponse.json({ error: 'id query param required' }, { status: 400 });
    }

    const success = await dbService.deleteUser(parseInt(userId, 10));
    return NextResponse.json({ success, message: 'User deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete user' }, { status: 500 });
  }
}
