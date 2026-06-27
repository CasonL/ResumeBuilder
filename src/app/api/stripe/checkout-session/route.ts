import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getCurrentUser } from '@/lib/auth-helpers';
import { CREDIT_PACKAGES } from '@/lib/credits-packages';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(key, {
    apiVersion: '2026-06-24.dahlia',
  });
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { packageId } = await request.json();
    const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);

    if (!pkg) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: pkg.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        credits: String(pkg.credits),
      },
      success_url: `${baseUrl}/dashboard?credits=success`,
      cancel_url: `${baseUrl}/dashboard?credits=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
