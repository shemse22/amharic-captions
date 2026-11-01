import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbService } from '@/lib/db';
import { getPlanById } from '@/lib/pricing-plans';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'እባክዎ መጀመሪያ ይግቡ (Please sign in to proceed with payment)' },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid checkout request.' }, { status: 400 });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid checkout request.' }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const planId =
      typeof payload.planId === 'string'
        ? payload.planId.trim()
        : typeof payload.planName === 'string'
          ? payload.planName.trim()
          : '';
    const plan = getPlanById(planId);

    if (!plan) {
      return NextResponse.json(
        { error: 'Please select a valid package.' },
        { status: 400 }
      );
    }

    const txRef = `BGERN-TX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const chapaSecretKey = process.env.CHAPA_SECRET_KEY || process.env.CHAPA_KEY;

    // Get origin for return URLs
    const origin =
      req.headers.get('origin') ||
      req.headers.get('host') ? `http://${req.headers.get('host')}` : 'http://localhost:3000';

    // Register pending payment record in database
    await dbService.createPayment({
      userId: user.id,
      planName: plan.id,
      amountEtb: plan.priceEtb,
      transactionRef: txRef,
      paymentMethod: 'CHAPA',
      minutesCredited: plan.minutes,
      creditsCredited: plan.credits,
      status: 'pending',
    });

    // If Chapa Secret Key is configured, initialize live transaction with Chapa API
    if (chapaSecretKey) {
      try {
        const chapaRes = await fetch('https://api.chapa.co/v1/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${chapaSecretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: plan.priceEtb.toString(),
            currency: 'ETB',
            email: user.email,
            first_name: user.name?.split(' ')[0] || 'Bgern',
            last_name: user.name?.split(' ').slice(1).join(' ') || 'Creator',
            tx_ref: txRef,
            callback_url: `${origin}/api/payments/webhook`,
            return_url: `${origin}/profile?payment=success&tx_ref=${txRef}`,
            customization: {
              title: `Bgern - ${plan.name}`,
              description: `Purchase ${plan.minutes} minutes (${plan.credits.toLocaleString()} AI Credits) for Amharic Captions`,
            },
          }),
        });

        const chapaData = await chapaRes.json();
        if (chapaRes.ok && chapaData.status === 'success' && chapaData.data?.checkout_url) {
          return NextResponse.json({
            success: true,
            checkoutUrl: chapaData.data.checkout_url,
            txRef,
            mode: 'live',
          });
        }

        console.warn('Chapa API response warning:', chapaData);
      } catch (err: unknown) {
        console.error('Chapa initialization error:', err instanceof Error ? err.message : err);
      }

      return NextResponse.json(
        { error: 'Unable to initialize the Chapa checkout. Please try again.' },
        { status: 502 }
      );
    }

    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Online checkout is temporarily unavailable. Please try manual payment.' },
        { status: 503 }
      );
    }

    // Seamless Sandbox / Instant Simulation Checkout for testing without API keys
    const simulationUrl = `${origin}/profile?payment=simulated&tx_ref=${txRef}&plan=${plan.id}`;
    return NextResponse.json({
      success: true,
      checkoutUrl: simulationUrl,
      txRef,
      mode: 'simulation',
      note: 'CHAPA_SECRET_KEY not active in .env; generated test simulation checkout.',
    });
  } catch (error: unknown) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initiate checkout session' },
      { status: 500 }
    );
  }
}
