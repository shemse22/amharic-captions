import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/payment-methods - Public endpoint to retrieve active payment methods
export async function GET() {
  try {
    const methods = await dbService.listPaymentMethods(true);
    return NextResponse.json({
      success: true,
      methods,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

