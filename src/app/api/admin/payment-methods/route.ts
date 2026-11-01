import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db';
import { getSessionUser, isAdminUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/payment-methods - Admin: list all payment methods
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!isAdminUser(user)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin privileges required' },
        { status: 403 }
      );
    }

    const methods = await dbService.listPaymentMethods(false);
    return NextResponse.json({
      success: true,
      methods,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to list payment methods' },
      { status: 500 }
    );
  }
}

// POST /api/admin/payment-methods - Admin: create a new payment method
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!isAdminUser(user)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin privileges required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, amharicName, account, holder, color, badge, instruction, isActive, order } = body;

    if (!name || !account || !holder) {
      return NextResponse.json(
        { error: 'Missing required fields: name, account, and holder are required.' },
        { status: 400 }
      );
    }

    const method = await dbService.createPaymentMethod({
      name: String(name),
      amharicName: amharicName ? String(amharicName) : undefined,
      account: String(account),
      holder: String(holder),
      color: color ? String(color) : 'bg-emerald-600',
      badge: badge ? String(badge) : 'Active',
      instruction: instruction ? String(instruction) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      order: order !== undefined ? Number(order) : undefined,
    });

    return NextResponse.json({
      success: true,
      method,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to create payment method' },
      { status: 500 }
    );
  }
}

